import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Button, message, Tag, Tooltip, Layout, Upload } from 'antd';
import { useAuth } from './auth/AuthContext';
import api from '../api';
import {
  FilePdfOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FileWordOutlined,
  FileOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface DashboardProps {
  files: FileItem[];
  onFilesUpdated: (files: FileItem[]) => void;
}

interface FileApiResponse {
  results?: FileItem[];
  count?: number;
}

interface FileItem {
  id: number;
  file: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  description: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ files, onFilesUpdated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleUpload = async (file: File) => {
    try {
      setUploadLoading(true);
      
      // Client-side validation
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // Excel
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // Word
        'application/msword',  // Old Word .doc
        'text/plain'
      ];
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        message.error('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        message.error('Only PDF, Excel, Word, and TXT files are allowed');
        return;
      }

      // Create form data with proper formatting
      const formData = new FormData();
      formData.append('file', file, file.name);  // Include filename

      // Send upload request
      const response = await api.post('/api/files/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',  // This will be overridden by Axios
        }
      });
      
      // Handle successful upload
      message.success('File uploaded successfully!');
      
      // Update files list with new file
      const newFile = response.data;
      onFilesUpdated([...files, newFile]);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Server response:', error.response?.data);
      
      if (error.response) {
        // Server-side error
        if (Array.isArray(error.response.data?.file)) {
          message.error(error.response.data.file[0]);
        } else if (error.response.data?.detail) {
          message.error(error.response.data.detail);
        } else {
          message.error('Failed to upload file. Please try again.');
        }
      } else {
        // Network error
        message.error('Network error. Please check your connection and try again.');
      }
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownload = async (fileId: number, filename: string) => {
    try {
      const response = await api.get(`/api/files/${fileId}/download/`, {
        responseType: 'blob'
      });

      // Check if we got a valid response
      if (!response.data) {
        throw new Error('No file data received');
      }

      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let finalFilename = filename;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
        if (filenameMatch) {
          finalFilename = decodeURIComponent(filenameMatch[1]);
        }
      }

      // Create blob and download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', finalFilename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`Download started: ${finalFilename}`);
    } catch (error: any) {
      console.error('Download error:', error);
      
      if (error.response?.status === 404) {
        message.error('File not found on server');
      } else if (error.response?.status === 403) {
        message.error('You do not have permission to download this file');
      } else {
        message.error('Failed to download file. Please try again.');
      }
    }
  };

  const handleDelete = async (fileId: number) => {
    try {
      await api.delete(`/api/files/${fileId}/`);
      message.success('File deleted successfully');
      onFilesUpdated(files.filter(file => file.id !== fileId));
    } catch (err) {
      message.error('Failed to delete file');
    }
  };

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await api.get<FileApiResponse>('/api/files/');
        
        // Ensure we have an array of files
        const filesData = Array.isArray(response.data) 
          ? response.data 
          : response.data.results || [];
        
        // Map the response to our FileItem interface
        const formattedFiles = filesData.map((file: any) => ({
          id: file.id,
          file: file.file,
          file_type: file.file_type || file.file.split('.').pop(), // Fallback to file extension if file_type is missing
          file_size: file.file_size,
          upload_date: file.upload_date,
          description: file.description || ''
        }));
        
        onFilesUpdated(formattedFiles);
      } catch (err: any) {
        console.error('API error:', err);
        setError(err.message || 'Failed to fetch files');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [user, onFilesUpdated]);

  if (!user) {
    return <div>Loading user data...</div>;
  }

  if (!files) {
    return <div>Loading files...</div>;
  }

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  const totalFiles = files.length;
  const fileTypeCounts = files.reduce((acc, file) => {
    const fileType = file.file_type || 'other';
    acc[fileType] = (acc[fileType] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const fileTypeStats = [
    { title: 'Total Files', value: totalFiles },
    { title: 'PDF Files', value: fileTypeCounts.pdf || 0 },
    { title: 'Excel Files', value: fileTypeCounts.xlsx || 0 },
    { title: 'Text Files', value: fileTypeCounts.txt || 0 },
    { title: 'Word Files', value: (fileTypeCounts.doc || 0) + (fileTypeCounts.docx || 0) }
  ];

  const cardMeta = [
    {
      icon: <FileOutlined style={{ color: '#1890ff', fontSize: 32 }} />,
      bg: '#e6f7ff',
    },
    {
      icon: <FilePdfOutlined style={{ color: '#cf1322', fontSize: 32 }} />,
      bg: '#fff1f0',
    },
    {
      icon: <FileExcelOutlined style={{ color: '#389e0d', fontSize: 32 }} />,
      bg: '#f6ffed',
    },
    {
      icon: <FileTextOutlined style={{ color: '#faad14', fontSize: 32 }} />,
      bg: '#fffbe6',
    },
    {
      icon: <FileWordOutlined style={{ color: '#722ed1', fontSize: 32 }} />,
      bg: '#f9f0ff',
    },
  ];

  const cardData = fileTypeStats.map((stat, idx) => ({
    ...stat,
    ...cardMeta[idx],
  }));

  const columns = [
    {
      title: 'File Name',
      dataIndex: 'file',
      key: 'file',
      width: '30%',
      render: (text: string) => {
        // Extract just the filename from the path or URL
        const filename = text.split('/').pop() || text;
        return (
          <Tooltip title={filename}>
            <span style={{ fontWeight: 500 }}>{filename}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Type',
      dataIndex: 'file_type',
      key: 'file_type',
      width: '15%',
      render: (type: string) => {
        // Map both MIME types and short names to user-friendly extensions
        const typeMap: { [key: string]: string } = {
          'application/pdf': 'pdf',
          'pdf': 'pdf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
          'xlsx': 'xlsx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'docx': 'docx',
          'application/msword': 'doc',
          'doc': 'doc',
          'text/plain': 'txt',
          'txt': 'txt'
        };
        
        // Get user-friendly type or use file extension
        let fileType = typeMap[type] || type.split('/').pop() || type;
        
        // If we still don't have a valid type, try to extract from filename
        if (!typeMap[type]) {
          const filename = type.split('/').pop();
          if (filename) {
            fileType = filename.toLowerCase().split('.').pop() || 'other';
          }
        }
        
        let icon = <FileOutlined />;
        let color = 'default';
        if (fileType === 'pdf') {
          icon = <FilePdfOutlined />;
          color = 'red';
        } else if (fileType === 'xlsx') {
          icon = <FileExcelOutlined />;
          color = 'green';
        } else if (fileType === 'docx' || fileType === 'doc') {
          icon = <FileWordOutlined />;
          color = 'purple';
        } else if (fileType === 'txt') {
          icon = <FileTextOutlined />;
          color = 'gold';
        }
        
        return <Tag color={color}>{icon} {fileType.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Upload Date',
      dataIndex: 'upload_date',
      key: 'upload_date',
      width: '20%',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '20%',
      render: (_: any, record: FileItem) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.id, record.file.split('/').pop() || record.file)}
            size="small"
          >
            Download
          </Button>
          <Button
            type="default"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            size="small"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            {cardData.map((stat, idx) => (
              <Col xs={24} sm={12} md={8} lg={6} key={stat.title}>
                <Card
                  style={{
                    background: stat.bg,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    borderRadius: 12,
                    minHeight: 120,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ marginRight: 24 }}>{stat.icon}</div>
                  <div>
                    <div style={{ fontSize: 16, color: '#595959', marginBottom: 4 }}>{stat.title}</div>
                    <div style={{ fontWeight: 700, fontSize: 32, color: '#222' }}>{stat.value}</div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          <div className="dashboard-section">
            <Title level={3} className="file-management-title">File Management</Title>
            
            {/* File Upload Card */}
            <Card
              style={{
                marginBottom: 24,
                background: '#fafcff',
                borderRadius: 12,
                boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                height: 260, // Fixed height for consistent layout
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  handleUpload(file);
                  return false;
                }}
                disabled={uploadLoading}
              >
                <Button
                  icon={<FileOutlined />}
                  type="primary"
                >
                  {uploadLoading ? 'Uploading...' : 'Upload File'}
                </Button>
              </Upload>
            </Card>

            {/* File Table Card */}
            <Card
              style={{
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
              }}
            >
              <Table
                rowKey="id"
                columns={columns}
                dataSource={files}
                pagination={{ pageSize: 10 }}
                style={{ background: '#fff', borderRadius: 12 }}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

Dashboard.displayName = 'Dashboard';

export default Dashboard;