
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCourseSharing } from "@/hooks/useCourseSharing";
import { X, Mail, Users } from "lucide-react";

interface ShareCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
}

export function ShareCourseModal({ isOpen, onClose, courseId, courseTitle }: ShareCourseModalProps) {
  const [emailsText, setEmailsText] = useState("");
  const [message, setMessage] = useState("");
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
  const { shareCourse, loading } = useCourseSharing();

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Parse and validate emails when text changes
  const parseEmails = (text: string) => {
    if (!text.trim()) {
      setParsedEmails([]);
      setInvalidEmails([]);
      return;
    }

    // Split by common delimiters: comma, semicolon, newline, space
    const emailList = text
      .split(/[,;\n\s]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    const valid: string[] = [];
    const invalid: string[] = [];

    emailList.forEach(email => {
      if (emailRegex.test(email)) {
        if (!valid.includes(email)) { // Avoid duplicates
          valid.push(email);
        }
      } else {
        if (!invalid.includes(email)) {
          invalid.push(email);
        }
      }
    });

    // Limit to 60 emails
    if (valid.length > 60) {
      invalid.push(...valid.slice(60));
      valid.splice(60);
    }

    setParsedEmails(valid);
    setInvalidEmails(invalid);
  };

  const handleEmailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setEmailsText(text);
    parseEmails(text);
  };

  const removeEmail = (emailToRemove: string) => {
    const updatedText = emailsText
      .split(/[,;\n\s]+/)
      .filter(email => email.trim() !== emailToRemove)
      .join(', ');
    setEmailsText(updatedText);
    parseEmails(updatedText);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedEmails.length === 0) return;

    const success = await shareCourse(courseId, parsedEmails, message.trim() || undefined);
    if (success) {
      setEmailsText("");
      setMessage("");
      setParsedEmails([]);
      setInvalidEmails([]);
      onClose();
    }
  };

  const handleClose = () => {
    setEmailsText("");
    setMessage("");
    setParsedEmails([]);
    setInvalidEmails([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Share Course with Students
            </DialogTitle>
            <DialogDescription>
              Share "{courseTitle}" with up to 60 students. Enter email addresses separated by commas, semicolons, or new lines.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emails" className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Addresses
                </span>
                <span className="text-sm text-muted-foreground">
                  {parsedEmails.length}/60 emails
                </span>
              </Label>
              <Textarea
                id="emails"
                placeholder="Enter email addresses separated by commas, semicolons, or new lines&#10;Example: student1@school.com, student2@school.com&#10;Or paste from spreadsheet..."
                value={emailsText}
                onChange={handleEmailsChange}
                rows={6}
                className="min-h-[120px]"
              />
              
              {/* Valid emails display */}
              {parsedEmails.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-700">
                    Valid Emails ({parsedEmails.length})
                  </Label>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 bg-green-50 rounded-md border">
                    {parsedEmails.map((email, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-green-100 text-green-800 hover:bg-green-200"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeEmail(email)}
                          className="ml-1 hover:text-green-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Invalid emails display */}
              {invalidEmails.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-red-700">
                    Invalid Emails ({invalidEmails.length})
                  </Label>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-2 bg-red-50 rounded-md border">
                    {invalidEmails.map((email, index) => (
                      <Badge 
                        key={index} 
                        variant="destructive" 
                        className="bg-red-100 text-red-800"
                      >
                        {email}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-red-600">
                    Please check the format of these email addresses or remove them.
                  </p>
                </div>
              )}

              {parsedEmails.length >= 60 && (
                <p className="text-xs text-amber-600">
                  Maximum limit of 60 emails reached. Additional emails will be ignored.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message for all recipients..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || parsedEmails.length === 0 || invalidEmails.length > 0}
            >
              {loading ? "Sending..." : `Send ${parsedEmails.length} Invitation${parsedEmails.length === 1 ? '' : 's'}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
