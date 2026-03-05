
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCourseSharing } from '@/hooks/useCourseSharing';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface CourseInvitationHandlerProps {
  invitationId: string;
  courseTitle: string;
  invitedByEmail: string;
  onInvitationHandled?: () => void;
}

export function CourseInvitationHandler({ 
  invitationId, 
  courseTitle, 
  invitedByEmail,
  onInvitationHandled 
}: CourseInvitationHandlerProps) {
  const [isHandling, setIsHandling] = useState(false);
  const [status, setStatus] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const { handleInvitation } = useCourseSharing();

  const handleAction = async (action: 'accept' | 'decline') => {
    setIsHandling(true);
    try {
      const success = await handleInvitation(invitationId, action);
      if (success) {
        setStatus(action === 'accept' ? 'accepted' : 'declined');
        onInvitationHandled?.();
      }
    } catch (error) {
      console.error('Error handling invitation:', error);
    } finally {
      setIsHandling(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'declined':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'accepted':
        return 'Invitation accepted';
      case 'declined':
        return 'Invitation declined';
      default:
        return 'Pending response';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-sm font-medium">Course Invitation</CardTitle>
          </div>
          <span className="text-xs text-gray-500">{getStatusText()}</span>
        </div>
        <CardDescription className="text-sm">
          You've been invited to view "{courseTitle}" by {invitedByEmail}
        </CardDescription>
      </CardHeader>
      
      {status === 'pending' && (
        <CardContent className="pt-0">
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => handleAction('accept')}
              disabled={isHandling}
              className="flex-1"
            >
              {isHandling ? 'Processing...' : 'Accept'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('decline')}
              disabled={isHandling}
              className="flex-1"
            >
              {isHandling ? 'Processing...' : 'Decline'}
            </Button>
          </div>
        </CardContent>
      )}
      
      {status !== 'pending' && (
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600">
            {status === 'accepted' 
              ? 'You now have access to this course.'
              : 'You have declined this invitation.'
            }
          </p>
        </CardContent>
      )}
    </Card>
  );
}
