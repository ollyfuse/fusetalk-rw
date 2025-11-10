import os

# Import base settings
from .base import *

# Import environment-specific settings
if os.environ.get('DJANGO_ENV') == 'production':
    from .production import *
else:
    from .local import *
