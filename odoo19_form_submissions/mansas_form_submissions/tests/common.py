import time
import uuid


def good_submission(**over):
    """A valid payload, shaped exactly like the website's LeadPayload."""
    data = {
        'name': 'Amina Rahman',
        'email': 'Amina@Example.com',
        'company': 'Example Co',
        'services': ['premium-websites', 'ai-agents'],
        'description': 'We need a new website and an AI assistant for our sales team.',
        'budget': 'USD 25k–75k',
        'contact': 'email',
        'phone': '',
        'submissionId': str(uuid.uuid4()),
        'startedAt': int(time.time() * 1000) - 30_000,
        'website': '',
        'attribution': {'utm_source': 'linkedin', 'landing_path': '/'},
    }
    data.update(over)
    return data
