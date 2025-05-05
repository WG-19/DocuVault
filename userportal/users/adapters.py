from __future__ import annotations

import typing

from django.conf import settings

if typing.TYPE_CHECKING:
    from django.http import HttpRequest

    from userportal.users.models import User


# Removed allauth adapter imports and related code
