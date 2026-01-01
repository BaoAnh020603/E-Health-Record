# NotificationBadge Component

Icon thông báo nhỏ hiển thị số lượng lịch nhắc uống thuốc hôm nay.

## Tính năng

- ✅ Tự động đếm số lịch nhắc active trong ngày
- ✅ Tự động refresh mỗi 30 giây
- ✅ 3 kích thước: small, medium, large
- ✅ Tùy chỉnh màu sắc
- ✅ Hiển thị badge đỏ với số lượng (tối đa 99+)
- ✅ Chế độ icon-only hoặc full component

## Cách sử dụng

### 1. Import component

```tsx
import NotificationBadge from '../components/NotificationBadge';
```

### 2. Sử dụng cơ bản

```tsx
// Icon với badge (mặc định)
<NotificationBadge />

// Icon nhỏ
<NotificationBadge size="small" />

// Icon lớn với màu tùy chỉnh
<NotificationBadge size="large" color="#FF6B6B" />

// Chỉ hiển thị icon (không có container)
<NotificationBadge iconOnly />
```

### 3. Props

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Kích thước icon |
| `showCount` | `boolean` | `true` | Hiển thị số lượng trong badge |
| `color` | `string` | `'#00A86B'` | Màu của icon |
| `iconOnly` | `boolean` | `false` | Chỉ hiển thị icon, không có container |

### 4. Kích thước

- **Small**: Icon 16px, Badge 16px
- **Medium**: Icon 20px, Badge 18px  
- **Large**: Icon 28px, Badge 22px

## Ví dụ thực tế

### Trong Header

```tsx
<View style={styles.header}>
  <Text style={styles.title}>Trang chủ</Text>
  <TouchableOpacity onPress={() => navigation.navigate('MedicationReminders')}>
    <NotificationBadge size="medium" color="#FFFFFF" iconOnly />
  </TouchableOpacity>
</View>
```

### Trong Quick Actions

```tsx
<TouchableOpacity 
  style={styles.actionCard}
  onPress={() => navigation.navigate('MedicationReminders')}
>
  <NotificationBadge size="large" color="#FF6B6B" iconOnly />
  <Text style={styles.actionLabel}>Nhắc nhở uống thuốc</Text>
</TouchableOpacity>
```

### Trong Tab Bar

```tsx
<Tab.Screen 
  name="Reminders" 
  component={RemindersScreen}
  options={{
    tabBarIcon: ({ color }) => (
      <NotificationBadge size="small" color={color} iconOnly />
    )
  }}
/>
```

## Cách hoạt động

1. Component tự động fetch số lượng lịch nhắc active từ database
2. Chỉ đếm lịch nhắc trong ngày hôm nay
3. Tự động refresh mỗi 30 giây
4. Hiển thị badge đỏ nếu có lịch nhắc (số > 0)
5. Hiển thị "99+" nếu số lượng > 99

## Database Query

```sql
SELECT id FROM medication_reminders
WHERE user_id = ?
  AND is_active = true
  AND next_reminder_at >= '2025-12-30T00:00:00'
  AND next_reminder_at <= '2025-12-30T23:59:59'
```

## Styling

Component sử dụng `position: 'absolute'` cho badge để đặt ở góc trên bên phải của icon.

Badge có:
- Background đỏ (#E74C3C)
- Border trắng (1.5px)
- Border radius 10px
- Font weight 700
- Padding horizontal tùy theo size

## Performance

- Lightweight component (~100 lines)
- Minimal re-renders
- Efficient database queries
- Auto cleanup on unmount
