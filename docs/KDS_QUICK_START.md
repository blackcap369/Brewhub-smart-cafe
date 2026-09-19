# Kitchen Display System (KDS) - Quick Start Guide

## 🚀 Getting Started

### Access the KDS

1. Navigate to: `https://your-domain.com/kitchen-dashboard`
2. Or click "KDS Dashboard" in the sidebar menu

### First Time Setup

1. **Enable Sound Notifications**
   - Click the speaker icon (🔊) in the top right
   - Sound is enabled by default
   - Click to mute/unmute as needed

2. **Enter Fullscreen Mode** (Optional)
   - Click the fullscreen icon (⛶) in the top right
   - Press `F11` or `Esc` to toggle
   - Recommended for kitchen TVs/tablets

## 📋 Daily Workflow

### 1. Morning Setup

- [ ] Open KDS Dashboard
- [ ] Check sound is enabled
- [ ] Verify fullscreen mode (if using dedicated display)
- [ ] Ensure stable internet connection

### 2. During Service

**When New Orders Arrive:**
1. 🔔 Sound notification plays automatically
2. 📋 Order appears with red pulsing border
3. 👀 Check order details and special instructions
4. 👆 Click "Start Preparing" or swipe left (mobile)

**While Preparing:**
- Order shows amber border
- Monitor elapsed time (turns red after 15 min)
- Check special instructions highlighted in yellow

**When Order is Ready:**
1. 👆 Click "Mark Ready" or swipe left (mobile)
2. ✅ Order shows green border
3. 📢 Waiter is notified to pick up
4. 🗑️ Order automatically disappears when served

### 3. End of Day

- [ ] Review any remaining orders
- [ ] Check for overdue items
- [ ] Close KDS Dashboard

## 🎯 Status Workflow

```
┌─────────────┐
│   RECEIVED  │ ← New order arrives (Red border)
│   (New)     │
└──────┬──────┘
       │ Click "Start Preparing"
       ↓
┌─────────────┐
│  PREPARING  │ ← Cooking in progress (Amber border)
└──────┬──────┘
       │ Click "Mark Ready"
       ↓
┌─────────────┐
│    READY    │ ← Ready for pickup (Green border)
└──────┬──────┘
       │ Waiter marks as served
       ↓
┌─────────────┐
│   SERVED    │ ← Order complete (Removed from KDS)
└─────────────┘
```

## 🔊 Sound Notifications

| Event | Sound | Action Required |
|-------|-------|-----------------|
| New Order | Double beep (high pitch) | Check and start preparing |
| Order Ready | Single beep (medium pitch) | Notify waiter |
| Order Cancelled | Single beep (low pitch) | Stop preparation |

**Volume Control:**
- Click speaker icon to mute/unmute
- Volume is set to 70% by default
- Adjust in browser settings if needed

## 📱 Mobile Usage

### Swipe Gestures

- **Swipe Left**: Move to next status
  - Received → Preparing
  - Preparing → Ready
  
- **Swipe Right**: Move to previous status
  - Ready → Preparing
  - Preparing → Received

### Touch Targets

All buttons are optimized for touch:
- Minimum size: 44x44 pixels
- Large spacing between buttons
- Clear visual feedback

## ⚠️ Important Indicators

### Overdue Orders

- **Visual**: Red "OVERDUE" badge
- **Time**: Elapsed time turns red after 15 minutes
- **Action**: Prioritize these orders immediately

### Special Instructions

- **Visual**: Yellow highlighted box with ⚠️ icon
- **Location**: Below items list
- **Action**: Read carefully before preparing

### Priority Orders

Orders are sorted by:
1. Creation time (oldest first)
2. Status (received → preparing → ready)

## 🎛️ Filter Tabs

Use filter tabs to focus on specific stages:

| Tab | Shows | Use Case |
|-----|-------|----------|
| **All** | All active orders | General overview |
| **New** | Only received orders | Focus on new orders |
| **Preparing** | Only preparing orders | Monitor cooking progress |
| **Ready** | Only ready orders | Coordinate with waiters |

## 📊 Statistics Bar

Real-time metrics at the top:

- **Active Orders**: Total orders in queue
- **New Orders**: Waiting to be started
- **Preparing**: Currently being cooked
- **Ready**: Waiting for pickup

Use these to:
- Gauge kitchen workload
- Identify bottlenecks
- Allocate staff efficiently

## 🔧 Troubleshooting

### Orders Not Appearing

1. Check internet connection
2. Refresh the page (F5)
3. Verify order was placed in POS
4. Check browser console for errors

### Sound Not Playing

1. Ensure sound is not muted (check speaker icon)
2. Check browser volume settings
3. Allow autoplay in browser settings
4. Try clicking anywhere on page first (browser policy)

### Fullscreen Not Working

1. Try different browser (Chrome/Firefox recommended)
2. Check browser permissions
3. Use F11 key as alternative
4. Note: iOS Safari doesn't support fullscreen API

### Slow Updates

1. Check internet connection speed
2. Refresh the page
3. Close other browser tabs
4. Contact IT if problem persists

## 💡 Best Practices

### For Kitchen Staff

1. **Check Orders Immediately**
   - Don't let orders pile up
   - Start with oldest first
   - Prioritize overdue items

2. **Read Special Instructions**
   - Always check for notes
   - Allergies are critical
   - Customizations matter

3. **Update Status Promptly**
   - Mark as "Preparing" when you start
   - Mark as "Ready" immediately when done
   - Helps waiters coordinate

4. **Monitor Elapsed Time**
   - Keep an eye on the timer
   - Red = urgent attention needed
   - Communicate delays to front of house

### For Managers

1. **Monitor Statistics**
   - Check active orders count
   - Identify peak times
   - Adjust staffing accordingly

2. **Use Filters**
   - Check "New" tab for backlog
   - Monitor "Preparing" for bottlenecks
   - Review "Ready" for pickup delays

3. **Regular Checks**
   - Visit kitchen during service
   - Verify KDS is working
   - Address any issues immediately

## 🎓 Training Checklist

### New Staff Training

- [ ] Show how to access KDS
- [ ] Explain status workflow
- [ ] Demonstrate sound notifications
- [ ] Practice swipe gestures (mobile)
- [ ] Show how to read special instructions
- [ ] Explain overdue indicators
- [ ] Demonstrate filter usage
- [ ] Review troubleshooting steps

### Ongoing Training

- [ ] Weekly review of performance metrics
- [ ] Monthly refresher on best practices
- [ ] Update training when features change
- [ ] Share tips and tricks among staff

## 📞 Support

### Common Issues

**Issue**: KDS not loading
**Solution**: Clear browser cache, check internet, contact IT

**Issue**: Orders not updating
**Solution**: Refresh page, check connection, verify Supabase status

**Issue**: Sound not working
**Solution**: Unmute, check browser settings, allow autoplay

### Contact

- **Technical Support**: IT Department
- **Feature Requests**: Product Manager
- **Bug Reports**: Development Team

## 🎉 Success Tips

1. **Keep the display visible** - Mount at eye level
2. **Test sound regularly** - Ensure notifications work
3. **Train all staff** - Everyone should know the workflow
4. **Monitor performance** - Use statistics to improve
5. **Communicate delays** - Keep front of house informed
6. **Stay organized** - Follow the workflow consistently
7. **Ask for help** - Don't hesitate to call for support

---

**Remember**: The KDS is a tool to help you work efficiently. Use it consistently and it will make your kitchen operations smoother!

**Version**: 1.0.0  
**Last Updated**: 2026
