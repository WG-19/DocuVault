// frontend/src/components/Profile.tsx
import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Space,
  Table,
  Modal,
  message,
  Switch
} from 'antd';
import { 
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useAuth } from './auth/AuthContext';
import api from '../api';

const { Title } = Typography;

interface Address {
  id: number;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_primary: boolean;
}

interface PhoneNumber {
  id: number;
  number: string;
}

interface APIResponse<T> {
  results?: T[];
  count?: number;
  next?: string;
  previous?: string;
}

interface AddressResponse extends APIResponse<Address> {}
interface PhoneResponse extends APIResponse<PhoneNumber> {}

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isPhoneModalVisible, setIsPhoneModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editingPhone, setEditingPhone] = useState<PhoneNumber | null>(null);
  const [isUsernameModalVisible, setIsUsernameModalVisible] = useState(false);

  // Add username change form state
  const [username, setUsername] = useState(user?.name || '');

  // Sync username state with user.name
  useEffect(() => {
    setUsername(user?.name || '');
  }, [user]);

  const handleUsernameChange = async (values: any) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await api.patch('/api/~update/', { name: values.name });
      if (response.status === 200) {
        message.success('Username updated successfully');
        await refreshUser(); // Refresh user data after update
        setIsUsernameModalVisible(false);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
                        err.response?.data?.message || 
                        err.message || 
                        'Failed to update username';
      message.error(errorMessage);
      console.error('Username update error:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch addresses
        const addressesResponse = await api.get<any>('/api/addresses/');
        const addressesData = Array.isArray(addressesResponse.data) 
          ? addressesResponse.data 
          : addressesResponse.data?.results || [];
        setAddresses(addressesData);

        // Fetch phone numbers
        const phonesResponse = await api.get<any>('/api/phones/');
        const phonesData = Array.isArray(phonesResponse.data) 
          ? phonesResponse.data 
          : phonesResponse.data?.results || [];
        setPhoneNumbers(phonesData);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  if (loading) {
    return <div>Loading profile data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Ensure we always return arrays for the tables
  const getAddresses = () => {
    return Array.isArray(addresses) ? addresses : [];
  };

  const getPhoneNumbers = () => {
    return Array.isArray(phoneNumbers) ? phoneNumbers : [];
  };

  const handleAddressModal = (address: Address | null = null) => {
    setEditingAddress(address);
    setIsAddressModalVisible(true);
  };

  const handlePhoneModal = (phone?: PhoneNumber) => {
    setEditingPhone(phone || null);
    setIsPhoneModalVisible(true);
  };

  const handleAddressSubmit = async (values: any) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // If setting to primary, unmark all other addresses first
      if (values.is_primary) {
        const otherAddresses = addresses.filter(addr => addr.id !== (editingAddress?.id || 0));
        for (const addr of otherAddresses) {
          await api.patch(`/api/addresses/${addr.id}/`, { is_primary: false });
        }
      }

      const data = {
        street: values.street,
        city: values.city,
        state: values.state,
        postal_code: values.postal_code,
        country: values.country,
        is_primary: values.is_primary
      };

      if (editingAddress) {
        const response = await api.patch(`/api/addresses/${editingAddress.id}/`, data);
        if (response.status === 200) {
          message.success('Address updated successfully');
          const { data: addressData } = await api.get('/api/addresses/');
          setAddresses(addressData.results || addressData);
          setEditingAddress(null);
          setIsAddressModalVisible(false);
        }
      } else {
        const response = await api.post('/api/addresses/', data);
        if (response.status === 201) {
          message.success('Address added successfully');
          const { data: addressData } = await api.get('/api/addresses/');
          setAddresses(addressData.results || addressData);
          setIsAddressModalVisible(false);
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
                        err.response?.data?.message || 
                        err.message || 
                        'Failed to save address';
      message.error(errorMessage);
      console.error('Address save error:', err);
    }
  };

  const handlePhoneSubmit = async (values: any) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const data = {
        number: values.number
      };

      // Get existing phone number if it exists
      const existingPhone = phoneNumbers[0];
      
      if (existingPhone) {
        // Update existing phone
        const response = await api.patch(`/api/phones/${existingPhone.id}/`, data);
        if (response.status === 200) {
          message.success('Phone number updated successfully');
          const { data: phoneData } = await api.get('/api/phones/');
          setPhoneNumbers(phoneData.results || phoneData);
          setIsPhoneModalVisible(false);
        }
      } else {
        // Create new phone
        const response = await api.post('/api/phones/', data);
        if (response.status === 201) {
          message.success('Phone number added successfully');
          const { data: phoneData } = await api.get('/api/phones/');
          setPhoneNumbers(phoneData.results || phoneData);
          setIsPhoneModalVisible(false);
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
                        err.response?.data?.message || 
                        err.message || 
                        'Failed to update phone number';
      message.error(errorMessage);
      console.error('Phone update error:', err);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await api.delete(`/api/addresses/${id}/`);
      setAddresses(addresses.filter(addr => addr.id !== id));
      message.success('Address deleted successfully');
    } catch (err) {
      message.error('Failed to delete address');
      console.error(err);
    }
  };

  const handleDeletePhone = async (id: number) => {
    try {
      await api.delete(`/api/phones/${id}/`);
      message.success('Phone number deleted');
      const { data: phoneData } = await api.get('/api/phones/');
      setPhoneNumbers(phoneData.results || phoneData);
    } catch (err: any) {
      message.error('Failed to delete phone number');
    }
  };

  // Handle address primary switch change
  const handleAddressPrimaryChange = async (checked: boolean, address: Address) => {
    try {
      // If setting to primary, first unmark all other addresses
      if (checked) {
        const otherAddresses = addresses.filter(addr => addr.id !== address.id);
        for (const addr of otherAddresses) {
          await api.patch(`/api/addresses/${addr.id}/`, { is_primary: false });
        }
      }
      
      // Update this address
      const response = await api.patch(`/api/addresses/${address.id}/`, { is_primary: checked });
      if (response.status === 200) {
        // Refresh addresses after update
        const { data: addressData } = await api.get('/api/addresses/');
        setAddresses(addressData.results || addressData);
      }
    } catch (err: any) {
      message.error('Failed to update address');
      // Refresh to revert the change if it failed
      const { data: addressData } = await api.get('/api/addresses/');
      setAddresses(addressData.results || addressData);
    }
  };

  // Get the existing phone number if it exists
  const existingPhone = phoneNumbers[0];

  return (
    <div className="profile-container">
      <Layout.Content className="profile-content-area flex justify-center items-center">
        <Card className="profile-card">
          <Space direction="vertical" size="large" className="profile-header-container">
            <div className="profile-header">
              <UserOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <div className="profile-info">
                <Typography.Title level={3} style={{ margin: 0 }}>
                  {user.name}
                </Typography.Title>
                <Typography.Text style={{ color: '#666' }}>
                  {user.email}
                </Typography.Text>
              </div>
              <Button type="primary" onClick={() => setIsUsernameModalVisible(true)}>
                Change Username
              </Button>
            </div>
          </Space>
        </Card>

        <div className="profile-sections flex justify-center items-center">
          <Card title="Addresses" className="profile-card">
            <Space direction="horizontal" className="profile-button-container">
              <Button type="primary" onClick={() => handleAddressModal()}>
                Add Address
              </Button>
            </Space>
            <Table
              dataSource={getAddresses()}
              columns={[
                {
                  title: 'Street',
                  dataIndex: 'street',
                  key: 'street',
                },
                {
                  title: 'City',
                  dataIndex: 'city',
                  key: 'city',
                },
                {
                  title: 'State',
                  dataIndex: 'state',
                  key: 'state',
                },
                {
                  title: 'Postal Code',
                  dataIndex: 'postal_code',
                  key: 'postal_code',
                },
                {
                  title: 'Country',
                  dataIndex: 'country',
                  key: 'country',
                },
                {
                  title: 'Primary',
                  dataIndex: 'is_primary',
                  key: 'is_primary',
                  render: (value: boolean, record: Address) => (
                    <Switch
                      checked={value}
                      onChange={(checked) => handleAddressPrimaryChange(checked, record)}
                      disabled={value && addresses.some(addr => addr.id !== record.id && addr.is_primary)}
                    />
                  )
                },
                {
                  title: 'Actions',
                  key: 'action',
                  render: (text: any, record: Address) => (
                    <Space size="middle">
                      <EditOutlined onClick={() => handleAddressModal(record)} />
                      <DeleteOutlined onClick={() => handleDeleteAddress(record.id)} />
                    </Space>
                  ),
                },
              ]}
            />
          </Card>

          <Card title="Phone Numbers" className="profile-card">
            <Space direction="horizontal" className="profile-button-container">
              <Button 
                type="primary" 
                onClick={() => setIsPhoneModalVisible(true)}
              >
                {existingPhone ? "Edit Phone Number" : "Add Phone Number"}
              </Button>
            </Space>
            <Table
              dataSource={phoneNumbers}
              columns={[
                {
                  title: 'Phone Number',
                  dataIndex: 'number',
                  key: 'number',
                  width: '80%'
                },
                {
                  title: 'Actions',
                  key: 'action',
                  width: '20%',
                  render: (_: any, record: PhoneNumber) => (
                    <div style={{ textAlign: 'center' }}>
                      <DeleteOutlined
                        style={{ color: 'black', cursor: 'pointer' }}
                        onClick={() => handleDeletePhone(record.id)}
                      />
                    </div>
                  )
                }
              ]}
              pagination={false}
              className="profile-table"
              rowKey="id"
            />
          </Card>
        </div>
      </Layout.Content>

      <Modal
        title={editingAddress ? 'Edit Address' : 'Add New Address'}
        visible={isAddressModalVisible}
        onCancel={() => setIsAddressModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          onFinish={handleAddressSubmit}
          initialValues={editingAddress || {} as Address}
          layout="vertical"
        >
          <Form.Item
            name="street"
            label="Street"
            rules={[{ required: true, message: 'Please enter street address' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="city"
            label="City"
            rules={[{ required: true, message: 'Please enter city' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="state"
            label="State"
            rules={[{ required: true, message: 'Please enter state' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="postal_code"
            label="Postal Code"
            rules={[{ required: true, message: 'Please enter postal code' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="country"
            label="Country"
            rules={[{ required: true, message: 'Please enter country' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="is_primary"
            valuePropName="checked"
            label="Primary Address"
          >
            <Switch />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
              <Button onClick={() => setIsAddressModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={existingPhone ? "Edit Phone Number" : "Add Phone Number"}
        open={isPhoneModalVisible}
        onCancel={() => setIsPhoneModalVisible(false)}
        footer={null}
      >
        <Form
          onFinish={handlePhoneSubmit}
          initialValues={existingPhone || {} as PhoneNumber}
          layout="vertical"
        >
          <Form.Item
            name="number"
            label="Phone Number"
            rules={[{ required: true, message: 'Please enter a phone number' }]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
              <Button onClick={() => setIsPhoneModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Change Username"
        visible={isUsernameModalVisible}
        onCancel={() => setIsUsernameModalVisible(false)}
        footer={null}
        width={400}
      >
        <Form
          onFinish={handleUsernameChange}
          initialValues={{ name: username }}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="New Username"
            rules={[{ required: true, message: 'Please enter a new username' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Username
              </Button>
              <Button onClick={() => setIsUsernameModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;