import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Calendar,
  Clock,
  MapPin,
  Users,
  Monitor,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthContext';
import type { Meeting, MeetingRoom } from '@/data/mockData';
import { 
  apiGetMeetingRooms, 
  apiGetMeetings, 
  apiCreateMeeting, 
  apiDeleteMeeting,
  type MeetingCreatePayload,
} from '@/lib/api';
import { toast } from 'sonner';

/**
 * API 接口:
 * GET /api/meeting-rooms - 获取会议室列表
 * 返回数据: MeetingRoom[]
 * 
 * GET /api/meetings - 获取会议预约列表
 * 请求参数: { date?: string, roomId?: string }
 * 返回数据: Meeting[]
 * 
 * POST /api/meetings - 创建会议预约
 * 请求体: {
 *   title: string,
 *   roomId: string,
 *   date: string,
 *   startTime: string,
 *   endTime: string,
 *   attendees: string[],
 *   description: string
 * }
 * 返回数据: { meeting: Meeting }
 * 
 * DELETE /api/meetings/:id - 取消预约
 * 返回数据: { success: boolean }
 * 
 * GET /api/meetings/check-availability - 检查时间段是否可用
 * 请求参数: { roomId: string, date: string, startTime: string, endTime: string }
 * 返回数据: { available: boolean }
 */

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

export default function MeetingBooking() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay());
    return start;
  });
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    title: '',
    roomId: '',
    date: selectedDate,
    startTime: '09:00',
    endTime: '10:00',
    attendees: '',
    description: '',
  });

  // Generate week dates
  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Fetch meeting rooms
  const { data: meetingRooms = [] } = useQuery({
    queryKey: ['meeting-rooms'],
    queryFn: apiGetMeetingRooms,
  });

  // Fetch meetings for the current week
  const weekDateRange = useMemo(() => {
    const dates = getWeekDates();
    return {
      start: formatDate(dates[0]),
      end: formatDate(dates[6]),
    };
  }, [currentWeekStart]);

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings', { date: weekDateRange.start }],
    queryFn: () => apiGetMeetings({ date: weekDateRange.start }),
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newStart);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Get meetings for a specific room and date
  const getRoomMeetings = (roomId: string, date: string) => {
    return meetings.filter(m => m.roomId === roomId && m.date === date);
  };

  // Check if a time slot is booked
  const isSlotBooked = (roomId: string, date: string, time: string) => {
    const roomMeetings = getRoomMeetings(roomId, date);
    return roomMeetings.some(meeting => {
      const start = meeting.startTime;
      const end = meeting.endTime;
      return time >= start && time < end;
    });
  };

  // Get meeting at a specific slot
  const getMeetingAtSlot = (roomId: string, date: string, time: string) => {
    const roomMeetings = getRoomMeetings(roomId, date);
    return roomMeetings.find(meeting => meeting.startTime === time);
  };

  const createMeetingMutation = useMutation({
    mutationFn: (payload: MeetingCreatePayload) => apiCreateMeeting(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setIsBookDialogOpen(false);
      setBookingForm({
        title: '',
        roomId: '',
        date: selectedDate,
        startTime: '09:00',
        endTime: '10:00',
        attendees: '',
        description: '',
      });
      toast.success('会议预约成功');
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || '预约失败');
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: (id: string) => apiDeleteMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('会议已取消');
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || '取消失败');
    },
  });

  const handleBook = () => {
    if (!bookingForm.title || !bookingForm.roomId || !bookingForm.date) {
      toast.error('请填写完整的预约信息');
      return;
    }
    if (!currentUser) {
      toast.error('请先登录');
      return;
    }

    const payload: MeetingCreatePayload = {
      title: bookingForm.title,
      roomId: bookingForm.roomId,
      date: bookingForm.date,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime,
      attendees: bookingForm.attendees.split(',').map(a => a.trim()).filter(Boolean),
      description: bookingForm.description,
    };

    createMeetingMutation.mutate(payload);
  };

  const handleCancelMeeting = (meetingId: string) => {
    if (confirm('确定要取消该会议吗？')) {
      deleteMeetingMutation.mutate(meetingId);
    }
  };

  // Get today's meetings for the current user
  const myTodayMeetings = meetings.filter(
    m => m.date === selectedDate && 
    (m.organizerId === currentUser?.id || m.attendees.includes(currentUser?.name || ''))
  );

  // Set first room as selected by default
  useEffect(() => {
    if (meetingRooms.length > 0 && !selectedRoom) {
      setSelectedRoom(meetingRooms[0]);
    }
  }, [meetingRooms, selectedRoom]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">会议室预约</h2>
          <p className="text-sm text-muted-foreground mt-1">
            预约会议室，管理会议日程
          </p>
        </div>
        <Dialog open={isBookDialogOpen} onOpenChange={setIsBookDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              预约会议室
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>预约会议室</DialogTitle>
              <DialogDescription>
                填写以下信息预约会议室
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">会议主题</Label>
                <Input
                  id="title"
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  placeholder="请输入会议主题"
                />
              </div>
              <div className="grid gap-2">
                <Label>会议室</Label>
                <Select
                  value={bookingForm.roomId}
                  onValueChange={(value) => setBookingForm({ ...bookingForm, roomId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择会议室" />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} ({room.capacity}人)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">日期</Label>
                <Input
                  id="date"
                  type="date"
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>开始时间</Label>
                  <Select
                    value={bookingForm.startTime}
                    onValueChange={(value) => setBookingForm({ ...bookingForm, startTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.slice(0, -1).map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>结束时间</Label>
                  <Select
                    value={bookingForm.endTime}
                    onValueChange={(value) => setBookingForm({ ...bookingForm, endTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.slice(1).map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="attendees">参会人员</Label>
                <Input
                  id="attendees"
                  value={bookingForm.attendees}
                  onChange={(e) => setBookingForm({ ...bookingForm, attendees: e.target.value })}
                  placeholder="多个参会人用逗号分隔"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">会议说明</Label>
                <Textarea
                  id="description"
                  value={bookingForm.description}
                  onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                  placeholder="会议内容说明"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBookDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleBook} disabled={createMeetingMutation.isPending}>
                {createMeetingMutation.isPending ? '预约中...' : '确认预约'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Meeting rooms list */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">会议室</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {meetingRooms.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无会议室</p>
                </div>
              ) : (
                meetingRooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRoom?.id === room.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{room.name}</h4>
                    <Badge variant="secondary">{room.capacity}人</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{room.location}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {room.equipment.map((eq) => (
                      <Badge key={eq} variant="outline" className="text-xs">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* My meetings today */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">今日我的会议</CardTitle>
            </CardHeader>
            <CardContent>
              {myTodayMeetings.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">今日暂无会议</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTodayMeetings.map((meeting) => (
                    <div key={meeting.id} className="p-3 rounded-lg border border-border">
                      <h4 className="font-medium text-foreground text-sm">{meeting.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{meeting.startTime} - {meeting.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{meeting.roomName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar view */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              预约日历 {selectedRoom ? `- ${selectedRoom.name}` : ''}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-32 text-center">
                {formatDate(weekDates[0])} ~ {formatDate(weekDates[6])}
              </span>
              <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedRoom ? (
              <div className="text-center py-12 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>请从左侧选择一个会议室查看预约情况</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Week header */}
                  <div className="grid grid-cols-8 gap-1 mb-2">
                    <div className="p-2 text-center text-sm text-muted-foreground">时间</div>
                    {weekDates.map((date) => {
                      const dateStr = formatDate(date);
                      const isToday = dateStr === today.toISOString().split('T')[0];
                      const isSelected = dateStr === selectedDate;
                      return (
                        <div
                          key={formatDate(date)}
                          className={`p-2 text-center cursor-pointer rounded-lg transition-colors ${
                            isSelected ? 'bg-primary text-primary-foreground' : 
                            isToday ? 'bg-primary/10' : 'hover:bg-muted'
                          }`}
                          onClick={() => setSelectedDate(dateStr)}
                        >
                          <div className="text-xs text-inherit opacity-80">
                            周{weekDays[date.getDay()]}
                          </div>
                          <div className="text-sm font-medium">
                            {date.getDate()}日
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Time slots grid */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    {timeSlots.slice(0, -1).map((time, index) => (
                      <div key={time} className={`grid grid-cols-8 gap-px ${index > 0 ? 'border-t border-border' : ''}`}>
                        <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30">
                          {time}
                        </div>
                        {weekDates.map((date) => {
                          const dateStr = formatDate(date);
                          const isBooked = isSlotBooked(selectedRoom.id, dateStr, time);
                          const meeting = getMeetingAtSlot(selectedRoom.id, dateStr, time);
                          
                          return (
                            <div
                              key={`${dateStr}-${time}`}
                              className={`p-1 min-h-12 ${
                                isBooked 
                                  ? 'bg-primary/10' 
                                  : 'bg-card hover:bg-muted/50 cursor-pointer'
                              }`}
                              onClick={() => {
                                if (!isBooked) {
                                  setBookingForm({
                                    ...bookingForm,
                                    roomId: selectedRoom.id,
                                    date: dateStr,
                                    startTime: time,
                                    endTime: timeSlots[index + 2] || timeSlots[index + 1],
                                  });
                                  setIsBookDialogOpen(true);
                                }
                              }}
                            >
                              {meeting && (
                                <div className="h-full p-1.5 rounded bg-primary/20 text-xs">
                                  <p className="font-medium text-primary truncate">{meeting.title}</p>
                                  <p className="text-muted-foreground truncate">{meeting.organizer}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-primary/20" />
                      <span>已预约</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-card border border-border" />
                      <span>可预约（点击预约）</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected date meetings */}
      {selectedRoom && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedDate} {selectedRoom.name} 预约列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getRoomMeetings(selectedRoom.id, selectedDate).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>当天暂无预约</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getRoomMeetings(selectedRoom.id, selectedDate).map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <span className="text-sm font-medium">{meeting.startTime}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{meeting.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {meeting.startTime} - {meeting.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {meeting.organizer}
                          </span>
                        </div>
                      </div>
                    </div>
                    {meeting.organizerId === currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleCancelMeeting(meeting.id)}
                        disabled={deleteMeetingMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
