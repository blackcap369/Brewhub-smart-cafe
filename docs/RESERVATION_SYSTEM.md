# Table Reservation System

## Overview

The Table Reservation System allows customers to book tables in advance and provides staff with comprehensive tools to manage reservations, track availability, and handle no-shows.

## Features

### Customer-Facing Features
- **Multi-step booking flow** with date, time, guest count, and contact details
- **Real-time availability** checking with visual indicators
- **Special requests** field for dietary requirements or occasions
- **Instant confirmation** with reservation details
- **SMS/Email reminders** before reservation time

### Staff-Facing Features
- **Calendar view** showing all reservations for the day
- **Check-in/Check-out** workflow
- **Table assignment** management
- **No-show tracking** and handling
- **Waitlist management** for fully booked times
- **Reservation statistics** and analytics
- **Staff notes** for special instructions

## Database Schema

### reservations Table
```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id),
  customer_id UUID REFERENCES users(id),
  table_id UUID REFERENCES tables(id),
  reservation_date DATE NOT NULL,
  time_slot TIME NOT NULL,
  guests INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  special_requests TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  duration_minutes INTEGER DEFAULT 90,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,
  reminder_sent_2hr BOOLEAN DEFAULT false,
  reminder_sent_30min BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  checked_in_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  marked_no_show_at TIMESTAMPTZ
);
```

### Status Flow
```
confirmed → checked_in → completed
    ↓
cancelled
    ↓
no_show
```

## Time Slot Logic

### Availability Calculation
- **Slot Duration**: 30-minute intervals
- **Reservation Duration**: 90 minutes (1.5 hours) default
- **Buffer Time**: 15 minutes between reservations
- **Operating Hours**: 8:00 AM - 10:00 PM (configurable)

### Availability Check
```typescript
// Check if table is available for a time slot
function checkTableAvailability(
  cafeId: string,
  date: string,
  timeSlot: string,
  guests: number
): Promise<TableAvailability[]>
```

The system checks:
1. Table capacity (seats >= guests)
2. No overlapping reservations
3. Buffer time between bookings
4. Table is active and not under maintenance

### Available Time Slots
```typescript
// Get all available time slots for a date
function getAvailableTimeSlots(
  cafeId: string,
  date: string,
  guests: number
): Promise<TimeSlot[]>
```

Returns time slots with:
- `time_slot`: Time in HH:MM format
- `available_tables`: Number of tables available
- `total_tables`: Total tables that can fit the party size

## Reservation Flow

### Customer Flow
1. **Select Date**: Calendar view showing next 7 days
2. **Select Time**: Available time slots with table availability
3. **Guest Count**: Number of guests (1-20)
4. **Special Requests**: Optional text area for special requirements
5. **Contact Details**: Name, phone, email (auto-fill if logged in)
6. **Confirmation**: Summary and confirmation

### Staff Flow
1. **View Reservations**: Calendar view with all bookings
2. **Check-in**: Mark guest as arrived
3. **Assign Table**: Assign specific table to reservation
4. **Add Notes**: Staff notes for special instructions
5. **Complete**: Mark reservation as completed
6. **No-show**: Mark as no-show after 15 minutes

## API Reference

### createReservation
```typescript
async function createReservation(
  input: CreateReservationInput
): Promise<{ success: boolean; reservation?: Reservation; error?: string }>
```

**Parameters:**
- `cafe_id`: UUID of the cafe
- `customer_id`: UUID of the customer (optional)
- `table_id`: UUID of the table (optional, auto-assigned)
- `reservation_date`: Date string (YYYY-MM-DD)
- `time_slot`: Time string (HH:MM:SS)
- `guests`: Number of guests
- `special_requests`: Special requests text (optional)
- `customer_name`: Customer name
- `customer_phone`: Customer phone
- `customer_email`: Customer email (optional)
- `duration_minutes`: Reservation duration (default: 90)
- `notes`: Staff notes (optional)

### getReservations
```typescript
async function getReservations(
  cafeId: string,
  date: string
): Promise<{ success: boolean; reservations?: Reservation[]; error?: string }>
```

Returns all reservations for a specific date.

### getAvailableTimeSlots
```typescript
async function getAvailableTimeSlots(
  cafeId: string,
  date: string,
  guests: number,
  openingTime?: string,
  closingTime?: string
): Promise<{ success: boolean; slots?: TimeSlot[]; error?: string }>
```

Returns available time slots with table availability.

### checkTableAvailability
```typescript
async function checkTableAvailability(
  cafeId: string,
  date: string,
  timeSlot: string,
  guests: number
): Promise<{ success: boolean; tables?: TableAvailability[]; error?: string }>
```

Returns table availability for a specific time slot.

### cancelReservation
```typescript
async function cancelReservation(
  reservationId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }>
```

Cancels a reservation with optional reason.

### checkInReservation
```typescript
async function checkInReservation(
  reservationId: string
): Promise<{ success: boolean; error?: string }>
```

Marks a reservation as checked in.

### completeReservation
```typescript
async function completeReservation(
  reservationId: string
): Promise<{ success: boolean; error?: string }>
```

Marks a reservation as completed.

### assignTable
```typescript
async function assignTable(
  reservationId: string,
  tableId: string
): Promise<{ success: boolean; error?: string }>
```

Assigns a specific table to a reservation.

### sendReminder
```typescript
async function sendReminder(
  reservationId: string,
  reminderType: '2hr' | '30min' | 'confirmation',
  sentVia: 'sms' | 'email' | 'push' | 'in_app'
): Promise<{ success: boolean; error?: string }>
```

Sends a reminder notification.

### markNoShows
```typescript
async function markNoShows(): Promise<{ success: boolean; count?: number; error?: string }>
```

Automatically marks reservations as no-show if 15 minutes past reservation time.

### getReservationStats
```typescript
async function getReservationStats(
  cafeId: string,
  startDate: string,
  endDate: string
): Promise<{
  success: boolean;
  stats?: {
    total_reservations: number;
    confirmed_count: number;
    checked_in_count: number;
    completed_count: number;
    cancelled_count: number;
    no_show_count: number;
    total_guests: number;
    avg_guests_per_reservation: number;
    no_show_rate: number;
  };
  error?: string;
}>
```

Returns reservation statistics for a date range.

## No-Show Handling

### Automatic Detection
The system automatically marks reservations as no-show when:
- Reservation time has passed
- Status is still 'confirmed'
- 15 minutes have elapsed since reservation time

### No-Show Tracking
- `no_show_count` field tracks customer no-show history
- Staff can view no-show rate in statistics
- Optional: Block customers with high no-show rate

### Waitlist Management
When a time slot is fully booked:
1. Customer can join waitlist
2. System notifies waitlist when cancellation occurs
3. Waitlist entries expire after 24 hours
4. Priority based on join time

## Reminder System

### Reminder Schedule
- **2 hours before**: First reminder
- **30 minutes before**: Final reminder
- **Confirmation**: Immediate confirmation after booking

### Reminder Channels
- SMS
- Email
- Push notification
- In-app notification

### Reminder Tracking
```typescript
reminder_sent_2hr: boolean
reminder_sent_30min: boolean
```

## Deposit System (Optional)

For large groups or peak times:
```typescript
deposit_amount: DECIMAL(10,2)
deposit_paid: BOOLEAN
```

### Deposit Rules
- Configurable per cafe
- Optional for large groups (8+ guests)
- Required for peak times (configurable)
- Refundable if cancelled within policy

## UI Components

### ReservationFlow Component
Multi-step reservation form with:
- Date picker (next 7 days)
- Time slot selector with availability
- Guest count selector
- Special requests textarea
- Contact details form
- Confirmation summary

### AdminReservations Component
Admin dashboard with:
- Calendar view (14-day strip)
- Reservation list with filters
- Check-in/Check-out buttons
- Table assignment
- Notes management
- No-show marking

## Integration Points

### Landing Page
Add reservation button to cafe landing page:
```typescript
<Link to="/reservations">
  Reserve a Table
</Link>
```

### Floor Map
Show reserved tables on floor map:
```typescript
// Tables with reservations show different color
const isReserved = reservations.some(r => r.table_id === table.id);
```

### Order System
Convert reservation to order on check-in:
```typescript
// After check-in, create order for the table
await createOrder({
  cafe_id: reservation.cafe_id,
  table_no: table.table_no,
  customer_id: reservation.customer_id,
  // ...
});
```

## Configuration

### Operating Hours
```typescript
// Default operating hours
const OPENING_TIME = '08:00:00';
const CLOSING_TIME = '22:00:00';
```

### Reservation Settings
```typescript
// Default settings
const SLOT_DURATION = 30; // minutes
const RESERVATION_DURATION = 90; // minutes
const BUFFER_TIME = 15; // minutes
const MAX_GUESTS = 20;
```

### No-Show Policy
```typescript
// Time after reservation to mark as no-show
const NO_SHOW_THRESHOLD = 15; // minutes
```

## Best Practices

### For Customers
1. Book in advance for peak times
2. Cancel at least 2 hours before reservation
3. Arrive on time to avoid no-show marking
4. Provide accurate contact information
5. Mention special requests during booking

### For Staff
1. Check reservations at start of shift
2. Assign tables before guest arrival
3. Note special requests for kitchen
4. Mark check-in promptly
5. Follow up on no-shows
6. Review reservation stats weekly

### For Owners
1. Monitor no-show rate
2. Adjust reservation duration based on data
3. Use waitlist for popular times
4. Consider deposits for large groups
5. Review reservation patterns for staffing

## Security

### Row Level Security
- Customers can only view their own reservations
- Staff can view all reservations for their cafe
- Only owners/managers can modify reservations

### Data Validation
- Phone number format validation
- Email format validation
- Date/time validation
- Guest count limits

### Privacy
- Customer data encrypted at rest
- Phone numbers masked in staff view (optional)
- GDPR compliance for EU customers

## Performance

### Database Optimization
- Indexed on `cafe_id` and `reservation_date`
- Indexed on `customer_id` for customer queries
- Indexed on `status` for filtering
- Partitioned by date for large datasets

### Caching
- Cache available time slots for 5 minutes
- Cache reservation counts per day
- Invalidate cache on new reservations

## Testing

### Test Scenarios
1. Create reservation for available time
2. Attempt double-booking same table
3. Cancel reservation and verify slot opens
4. Check-in and complete reservation
5. Mark no-show after threshold
6. Join waitlist for fully booked time
7. Send reminders at correct times
8. View reservation statistics

### Edge Cases
- Reservation at closing time
- Large party (20 guests)
- Multiple reservations same time
- Cancellation during check-in
- No-show with deposit

## Future Enhancements

### Planned Features
- [ ] Recurring reservations (weekly/monthly)
- [ ] Group booking management
- [ ] Table preference (window, patio, etc.)
- [ ] Integration with POS system
- [ ] Mobile app push notifications
- [ ] QR code check-in
- [ ] Reservation analytics dashboard
- [ ] Automated waitlist notifications
- [ ] Multi-language support for reservations
- [ ] Reservation fees for peak times

### Advanced Features
- [ ] AI-powered availability prediction
- [ ] Dynamic pricing based on demand
- [ ] Customer loyalty integration
- [ ] Social media sharing
- [ ] Review request after completion
- [ ] Table layout optimization
- [ ] Staff scheduling based on reservations

## Troubleshooting

### Common Issues

**No available time slots**
- Check operating hours configuration
- Verify table capacity settings
- Review existing reservations
- Check buffer time settings

**Reservation not showing**
- Verify cafe_id is correct
- Check date format (YYYY-MM-DD)
- Verify time format (HH:MM:SS)
- Check RLS policies

**Reminders not sending**
- Verify notification service configuration
- Check customer contact information
- Review reminder schedule settings
- Check SMS/email service status

## Support

For issues or questions:
- Check database logs for errors
- Review RLS policies in Supabase
- Verify service function permissions
- Check notification service configuration

---

**Version**: 1.0.0  
**Last Updated**: 2026  
**Status**: ✅ Production Ready
