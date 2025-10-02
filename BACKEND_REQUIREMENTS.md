# Backend Development Requirements

## NXFS Frontend Integration Needs

**Document Version:** 1.0
**Date:** 2025-09-28
**Frontend Framework:** Next.js 15 with TypeScript
**API Integration:** Domain-driven architecture with Axios clients

---

## 🔥 High Priority - Missing API Endpoints

### 1. Blog Media API

**Status:** Missing
**Priority:** High
**Frontend Impact:** Blog admin functionality incomplete

#### Required Endpoints:

```
POST /api/blog/media/upload/
- File upload for blog images/attachments
- Support multipart/form-data
- Max file size: 10MB per file
- Supported formats: jpg, png, gif, webp, pdf, doc, docx

GET /api/blog/media/
- List all media files with pagination
- Filters: file_type, date_range, user_id
- Response: { count, results: MediaFile[] }

DELETE /api/blog/media/{id}/
- Delete media file and associated file storage
- Cascade delete from blog posts if referenced

GET /api/blog/media/{id}/
- Get media file details and metadata
```

#### Expected Response Format:

```typescript
interface MediaFile {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  uploaded_by: number;
  url: string;
  thumbnail_url?: string;
}
```

### 2. Advanced Task Filtering API

**Status:** Basic CRUD exists, advanced filtering missing
**Priority:** High
**Frontend Impact:** Limited task management functionality

#### Required Enhancements:

```
GET /api/tasks/?category=web&project=nxfs&status=in_progress&priority=high&due_date_start=2025-01-01&due_date_end=2025-12-31&search=bug
- Multiple category filtering
- Project-based filtering
- Date range filtering (due_date_start, due_date_end)
- Priority-based filtering
- Full-text search across title, description
- Combined filters with AND logic
```

#### Expected Response Format:

```typescript
interface TasksFilterResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Task[];
  filters_applied: {
    categories?: string[];
    projects?: string[];
    status?: string[];
    priority?: string[];
    date_range?: { start: string; end: string };
    search?: string;
  };
}
```

### 3. Bulk Operations API

**Status:** Missing
**Priority:** Medium
**Frontend Impact:** No batch operations available

#### Required Endpoints:

```
POST /api/tasks/bulk-update/
Request: {
  task_ids: number[];
  updates: {
    status?: 'todo' | 'in_progress' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    category?: string[];
    project?: string;
  };
}
Response: {
  updated_count: number;
  failed_updates: { id: number; error: string }[];
}

DELETE /api/tasks/bulk-delete/
Request: { task_ids: number[] }
Response: { deleted_count: number; failed_deletes: number[] }
```

### 4. User Management API (Admin)

**Status:** Basic auth exists, admin management missing
**Priority:** Medium
**Frontend Impact:** No admin user management

#### Required Endpoints:

```
GET /api/admin/users/
- List all users with pagination
- Filters: is_active, role, registration_date

PUT /api/admin/users/{id}/
- Update user roles and permissions
- Enable/disable user accounts

POST /api/admin/users/{id}/reset-password/
- Admin-initiated password reset
```

---

## 🏗️ API Response Standardization

### 1. Error Response Format

**Status:** Inconsistent across endpoints
**Priority:** High
**Frontend Impact:** Error handling complexity

#### Required Standard Format:

```typescript
interface APIError {
  error: {
    code: string; // Machine-readable error code
    message: string; // User-friendly message
    details?: any; // Additional error context
    field_errors?: {
      // For validation errors
      [field: string]: string[];
    };
  };
  timestamp: string;
  request_id: string; // For debugging
}
```

#### HTTP Status Code Standards:

- `400` - Validation errors, malformed requests
- `401` - Authentication required
- `403` - Permission denied
- `404` - Resource not found
- `409` - Conflict (duplicate data)
- `422` - Business logic validation failed
- `500` - Server error

### 2. Pagination Response Standardization

**Status:** Partially implemented
**Priority:** Medium
**Frontend Impact:** Inconsistent pagination handling

#### Current Django REST Framework Format (Keep):

```typescript
interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}
```

#### Ensure ALL list endpoints support:

- `page` and `page_size` query parameters
- Consistent metadata in response
- Maximum page_size limit (e.g., 100)

---

## 🔄 Real-time Features Enhancement

### 1. Socket.IO Backend Implementation

**Status:** Basic setup exists, business logic missing
**Priority:** Medium
**Frontend Impact:** Limited real-time functionality

#### Required Socket.IO Events:

```typescript
// Server -> Client Events
'task_updated': { task_id: number; task: Task; updated_by: number }
'task_created': { task: Task; created_by: number }
'task_deleted': { task_id: number; deleted_by: number }
'user_joined': { user_id: number; room: string }
'user_left': { user_id: number; room: string }
'notification': { type: string; message: string; data?: any }

// Client -> Server Events
'join_room': { room: string }      // e.g., 'project_123', 'tasks'
'leave_room': { room: string }
'task_update': { task_id: number; updates: Partial<Task> }
```

#### Room Management:

- `tasks` - Global task updates
- `project_{id}` - Project-specific updates
- `user_{id}` - User-specific notifications

### 2. User Presence Tracking

**Status:** Missing
**Priority:** Low
**Frontend Impact:** No collaborative indicators

#### Required Implementation:

- Track online users per room/project
- Emit presence updates on join/leave
- Cleanup inactive connections
- Store last_seen timestamps

---

## 📊 System Monitoring Improvements

### 1. System Stats Data Consistency

**Status:** Fixed in frontend, verify backend
**Priority:** Low
**Context:** Frontend now handles missing `cpu_percent` gracefully

#### Recommendations:

- Ensure all SystemStats fields are populated consistently
- Add data validation before saving stats
- Handle hardware detection failures gracefully
- Add logging for failed stat collection

### 2. Historical Data Cleanup

**Status:** Unknown
**Priority:** Low

#### Suggested Features:

- Automatic cleanup of old system stats (>30 days)
- Data aggregation for long-term storage
- Performance optimization for large datasets

---

## 🔐 Security & Performance Requirements

### 1. Authentication Enhancements

**Status:** JWT working, needs improvements
**Priority:** Medium

#### Required Features:

- Token refresh mechanism (automatic)
- Session timeout configuration
- Rate limiting per user/endpoint
- Audit logging for sensitive operations

### 2. API Performance

**Status:** Good for small datasets
**Priority:** Medium

#### Optimization Needs:

- Database query optimization for large datasets
- Response caching for frequently accessed data
- Async processing for heavy operations
- API response compression

---

## 🌐 Integration Context

### Frontend API Client Structure

The frontend uses a domain-driven API architecture:

```
src/lib/api/
├── auth/           # Authentication & user management
├── blog/           # Blog posts and media
├── chat/           # N8N chatbot integration
├── memo/           # Electrical memo system
├── system/         # System monitoring & stats
├── tasks/          # Task management
├── shared/         # Common utilities & types
└── index.ts        # Centralized exports
```

### Current Authentication Flow

- JWT tokens stored in Zustand store
- Automatic token refresh via Axios interceptors
- Global error handling with toast notifications
- Authentication check on all protected routes

### Error Handling Expectations

The frontend expects:

- Consistent error response format
- Proper HTTP status codes
- Toast-friendly error messages
- Field-level validation errors for forms

### TypeScript Integration

- All API responses must match TypeScript interfaces
- Domain-specific type definitions in each API module
- Support for both direct arrays and paginated responses
- Null safety for optional fields

---

## 📋 Implementation Priority

### Phase 1 (Week 2) - Critical Missing APIs

1. Blog Media API endpoints
2. Advanced Task Filtering
3. Error response standardization

### Phase 2 (Week 3) - Bulk Operations & Admin

1. Bulk task operations
2. Admin user management API
3. Performance optimizations

### Phase 3 (Week 4) - Real-time Features

1. Socket.IO business logic implementation
2. User presence tracking
3. Live notification system

### Phase 4 (Week 5+) - Enhancements

1. Advanced security features
2. Analytics and reporting APIs
3. Performance monitoring

---

## 🧪 Testing Requirements

### API Testing Expectations

- Unit tests for all new endpoints
- Integration tests for complex workflows
- Performance testing for bulk operations
- Error handling validation

### Frontend Integration Testing

- Automated API contract testing
- Frontend E2E tests depend on stable API
- Consistent test data fixtures needed

---

## 📞 Communication & Handoff

### Questions for Backend Team

1. **Timeline**: What's the estimated timeline for Phase 1 items?
2. **Bulk Operations**: Any concerns about performance for large datasets?
3. **Real-time**: Current Socket.IO infrastructure capacity?
4. **Testing**: Preferred testing frameworks and patterns?

### Frontend Team Contact

- **Primary Contact**: [Your Name]
- **Technical Questions**: Available for API integration discussions
- **Testing**: Can provide frontend integration testing support

### Documentation Updates Needed

- Update API schema at `api.nxfs.no/schema/` after implementation
- Provide example requests/responses for new endpoints
- Document any breaking changes with migration guide

---

**Next Steps:**

1. Backend team review and estimate effort
2. Prioritize items based on business needs
3. Plan implementation sprints
4. Set up regular sync meetings for integration testing

_Generated from Frontend TODO.md analysis - 2025-09-28_

---

# Location-Based Job Entry Requirements

**Added:** 2025-10-01
**Priority:** High
**Frontend Feature:** Auto-entry to nearby jobs based on GPS location
**Status:** Frontend implementation complete, awaiting backend optimization

---

## 🎯 Problem Statement

The frontend currently implements location-based job proximity detection, but it's **inefficient**:

- Geocodes every job's address on-demand (20 jobs = 20 API calls to Kartverket)
- Each auto-entry check takes 4-10 seconds
- Same addresses get geocoded repeatedly
- Risk of rate limiting from Kartverket API
- Poor user experience with long wait times

## ✅ Solution: Backend Geocoding & Storage

Store geocoded coordinates in the database and provide a proximity search endpoint.

---

## 1. Database Schema Changes

### Job Model Updates

Add geocoding fields to the `Job` model:

```python
class Job(models.Model):
    # Existing fields
    ordre_nr = models.CharField(max_length=10, primary_key=True)
    tittel = models.CharField(max_length=200, blank=True)
    adresse = models.CharField(max_length=200, blank=True)
    telefon_nr = models.CharField(max_length=20, blank=True)
    beskrivelse = models.TextField(blank=True)
    ferdig = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # NEW GEOCODING FIELDS
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="Latitude coordinate from geocoded address"
    )
    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="Longitude coordinate from geocoded address"
    )
    geocoded_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when address was last geocoded"
    )
    geocode_accuracy = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        choices=[
            ('exact', 'Exact Match'),
            ('approximate', 'Approximate Match'),
            ('failed', 'Geocoding Failed'),
        ],
        help_text="Quality of geocoding result"
    )
```

### Database Indexes

```python
class Meta:
    indexes = [
        models.Index(fields=['latitude', 'longitude']),
        models.Index(fields=['ferdig', 'latitude', 'longitude']),
    ]
```

---

## 2. Geocoding Service

Create `services/geocoding.py`:

```python
import requests
from typing import Optional
from django.core.cache import cache

class GeocodingService:
    """Service for geocoding Norwegian addresses using Kartverket API"""

    KARTVERKET_SEARCH_URL = "https://ws.geonorge.no/adresser/v1/sok"
    CACHE_TIMEOUT = 86400 * 30  # 30 days

    @classmethod
    def geocode_address(cls, address: str) -> Optional[dict]:
        """
        Geocode a Norwegian address

        Returns:
            dict: {'lat': float, 'lon': float, 'accuracy': str}
            None: if geocoding failed
        """
        if not address or not address.strip():
            return None

        # Check cache first
        cache_key = f"geocode:{address.lower().strip()}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result

        try:
            response = requests.get(
                cls.KARTVERKET_SEARCH_URL,
                params={'sok': address, 'treffPerSide': 1},
                timeout=5
            )

            if not response.ok:
                return None

            data = response.json()

            if data.get('adresser') and len(data['adresser']) > 0:
                address_data = data['adresser'][0]

                if address_data.get('representasjonspunkt'):
                    result = {
                        'lat': address_data['representasjonspunkt']['lat'],
                        'lon': address_data['representasjonspunkt']['lon'],
                        'accuracy': 'exact'
                    }
                    cache.set(cache_key, result, cls.CACHE_TIMEOUT)
                    return result

            return None

        except Exception as e:
            print(f"Geocoding error for '{address}': {e}")
            return None

    @classmethod
    def calculate_distance(cls, lat1: float, lon1: float,
                          lat2: float, lon2: float) -> float:
        """Calculate distance between coordinates (Haversine formula)"""
        from math import radians, sin, cos, sqrt, atan2

        R = 6371e3  # Earth's radius in meters

        φ1 = radians(lat1)
        φ2 = radians(lat2)
        Δφ = radians(lat2 - lat1)
        Δλ = radians(lon2 - lon1)

        a = sin(Δφ/2) * sin(Δφ/2) + \
            cos(φ1) * cos(φ2) * sin(Δλ/2) * sin(Δλ/2)
        c = 2 * atan2(sqrt(a), sqrt(1-a))

        return R * c  # meters
```

---

## 3. Auto-Geocoding Signal Handler

Create `signals.py` to auto-geocode on save:

```python
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Job
from .services.geocoding import GeocodingService
from django.utils import timezone

@receiver(pre_save, sender=Job)
def geocode_job_address(sender, instance, **kwargs):
    """Auto-geocode job address when created or address changes"""

    # Check if address changed
    try:
        old_instance = Job.objects.get(pk=instance.pk)
        address_changed = old_instance.adresse != instance.adresse
    except Job.DoesNotExist:
        address_changed = True  # New job

    if address_changed and instance.adresse and instance.adresse.strip():
        result = GeocodingService.geocode_address(instance.adresse)

        if result:
            instance.latitude = result['lat']
            instance.longitude = result['lon']
            instance.geocoded_at = timezone.now()
            instance.geocode_accuracy = result['accuracy']
        else:
            instance.latitude = None
            instance.longitude = None
            instance.geocode_accuracy = 'failed'
            instance.geocoded_at = timezone.now()
```

---

## 4. API Endpoint: Nearby Jobs

### Endpoint Specification

**URL:** `GET /api/memo/jobs/nearby/`

**Query Parameters:**

- `lat` (required): User's latitude
- `lon` (required): User's longitude
- `radius` (optional, default=100): Search radius in meters
- `ferdig` (optional): Filter by completion status

**Response Format:**

```json
[
  {
    "ordre_nr": "8001",
    "tittel": "Electrical Installation",
    "adresse": "Stortingsgata 4, 0158 OSLO",
    "telefon_nr": "+47 123 45 678",
    "beskrivelse": "Install electrical panel",
    "ferdig": false,
    "latitude": 59.9133,
    "longitude": 10.7389,
    "geocoded_at": "2025-10-01T12:00:00Z",
    "geocode_accuracy": "exact",
    "distance": 45.2,
    "total_hours": 12.5,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-20T14:45:00Z"
  }
]
```

### Serializer Updates

```python
from rest_framework import serializers
from .models import Job

class JobSerializer(serializers.ModelSerializer):
    distance = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'ordre_nr', 'tittel', 'adresse', 'telefon_nr',
            'beskrivelse', 'ferdig', 'latitude', 'longitude',
            'geocoded_at', 'geocode_accuracy', 'distance',
            'total_hours', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'latitude', 'longitude',
            'geocoded_at', 'geocode_accuracy'
        ]

    def get_distance(self, obj):
        """Calculate distance if user coords provided"""
        user_lat = self.context.get('user_lat')
        user_lon = self.context.get('user_lon')

        if user_lat and user_lon and obj.latitude and obj.longitude:
            from .services.geocoding import GeocodingService
            return round(GeocodingService.calculate_distance(
                user_lat, user_lon, obj.latitude, obj.longitude
            ), 1)
        return None
```

### ViewSet Implementation

```python
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Job
from .serializers import JobSerializer
from .services.geocoding import GeocodingService

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer

    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """Get jobs near a location"""
        try:
            user_lat = float(request.query_params.get('lat'))
            user_lon = float(request.query_params.get('lon'))
        except (TypeError, ValueError):
            return Response(
                {'error': 'lat and lon are required and must be numbers'},
                status=400
            )

        radius = float(request.query_params.get('radius', 100))
        ferdig = request.query_params.get('ferdig')

        # Filter jobs with coordinates
        queryset = self.queryset.filter(
            latitude__isnull=False,
            longitude__isnull=False
        )

        if ferdig is not None:
            queryset = queryset.filter(ferdig=ferdig.lower() == 'true')

        # Calculate distances and filter by radius
        nearby_jobs = []
        for job in queryset:
            distance = GeocodingService.calculate_distance(
                user_lat, user_lon,
                float(job.latitude), float(job.longitude)
            )

            if distance <= radius:
                nearby_jobs.append({'job': job, 'distance': distance})

        # Sort by distance
        nearby_jobs.sort(key=lambda x: x['distance'])

        # Serialize with distance
        serializer = self.get_serializer(
            [item['job'] for item in nearby_jobs],
            many=True,
            context={'user_lat': user_lat, 'user_lon': user_lon}
        )

        return Response(serializer.data)
```

---

## 5. Management Command: Bulk Geocoding

Create `management/commands/geocode_jobs.py`:

```python
from django.core.management.base import BaseCommand
from memo.models import Job
from memo.services.geocoding import GeocodingService
from django.utils import timezone

class Command(BaseCommand):
    help = 'Geocode all jobs with addresses'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Re-geocode all jobs even if already geocoded',
        )

    def handle(self, *args, **options):
        force = options['force']

        if force:
            jobs = Job.objects.filter(
                adresse__isnull=False
            ).exclude(adresse='')
        else:
            jobs = Job.objects.filter(
                adresse__isnull=False,
                latitude__isnull=True
            ).exclude(adresse='')

        total = jobs.count()
        success = 0
        failed = 0

        self.stdout.write(f"Found {total} jobs to geocode...")

        for job in jobs:
            result = GeocodingService.geocode_address(job.adresse)

            if result:
                job.latitude = result['lat']
                job.longitude = result['lon']
                job.geocoded_at = timezone.now()
                job.geocode_accuracy = result['accuracy']
                job.save()
                success += 1
                self.stdout.write(f"✓ {job.ordre_nr}: {job.adresse}")
            else:
                job.geocode_accuracy = 'failed'
                job.geocoded_at = timezone.now()
                job.save()
                failed += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"✗ {job.ordre_nr}: Failed"
                    )
                )

        self.stdout.write(self.style.SUCCESS(
            f"\nComplete: {success} succeeded, {failed} failed"
        ))
```

---

## 6. Migration & Deployment

```bash
# Create migration
python manage.py makemigrations memo

# Apply migration
python manage.py migrate memo

# Geocode existing jobs
python manage.py geocode_jobs

# Force re-geocode all
python manage.py geocode_jobs --force
```

---

## 7. Performance Benefits

### Before (Current Frontend Implementation)

- 20 jobs = 20 Kartverket API calls
- Average response time: **4-10 seconds**
- No caching
- Rate limiting risk
- Poor mobile experience

### After (Backend Implementation)

- 20 jobs = **1 database query**
- Average response time: **< 100ms**
- 30-day caching
- No rate limiting issues
- Instant mobile response

**Performance Improvement: ~100x faster** 🚀

---

## 8. Frontend Integration

Once backend is deployed, frontend will update to:

```typescript
// Before: Geocode all jobs client-side (slow)
const nearbyJobs = await Promise.all(
  jobs.map((job) => geocodeAndCalculateDistance(job))
);

// After: Single API call (fast)
const nearbyJobs = await jobsAPI.getNearbyJobs({
  lat: location.latitude,
  lon: location.longitude,
  radius: 100,
});
```

Frontend will maintain fallback to client-side geocoding for backward compatibility.

---

## 9. Testing Checklist

- [ ] Unit test: `GeocodingService.geocode_address()`
- [ ] Unit test: `GeocodingService.calculate_distance()`
- [ ] Integration test: Job auto-geocoding signal
- [ ] API test: `/nearby/` endpoint with various radii
- [ ] API test: Invalid coordinates handling
- [ ] Performance test: 1000+ jobs proximity search
- [ ] Cache test: Verify 30-day caching works
- [ ] Migration test: Existing jobs geocoded correctly

---

## 10. Additional Features (Optional)

### Heatmap Data Endpoint

```python
@action(detail=False, methods=['get'])
def heatmap(self, request):
    """Get job locations for heatmap visualization"""
    jobs = self.queryset.filter(
        latitude__isnull=False,
        longitude__isnull=False
    )

    return Response([
        {
            'lat': float(job.latitude),
            'lon': float(job.longitude),
            'ordre_nr': job.ordre_nr,
            'tittel': job.tittel,
            'ferdig': job.ferdig
        }
        for job in jobs
    ])
```

### Geofencing Alerts

- Notify users when entering/leaving job radius
- Automatic time tracking when near job location
- Push notifications for nearby incomplete jobs

---

## 📋 Implementation Priority

**Priority:** High
**Estimated Effort:** 4-6 hours
**Dependencies:** None
**Frontend Impact:** Major UX improvement

### Implementation Steps

1. **Day 1:** Database migration + geocoding service (2 hours)
2. **Day 1:** Signal handler + bulk command (1 hour)
3. **Day 2:** API endpoint + serializer (2 hours)
4. **Day 2:** Testing + deployment (1 hour)

---

## 🔗 Related Resources

- **Kartverket API Docs:** https://ws.geonorge.no/adresser/v1/
- **Frontend Implementation:** `src/app/memo/page.tsx:242-333`
- **TypeScript Types:** `src/lib/api/memo/types.ts:54-65`

---

_Updated: 2025-10-01 - Location-based features_
