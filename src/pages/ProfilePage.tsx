
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FloatingCard } from "@/components/ui/floating-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Calendar, Brain, BookOpen, Trophy, Upload, Camera, Settings, Edit3, Save, X } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { courses } = useCourses();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: user?.email || '',
    avatar_url: '',
    learner_type: '',
    country_id: '',
    current_education_level_id: '',
    onboarding_completed: false
  });
  const [countries, setCountries] = useState<any[]>([]);
  const [educationLevels, setEducationLevels] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<any>(null);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalHours: 0,
    streak: 0
  });

  useEffect(() => {
    fetchProfile();
    fetchCountries();
    calculateStats();
  }, [user, courses]);

  useEffect(() => {
    if (profile.country_id) {
      fetchEducationLevels(profile.country_id);
    }
  }, [profile.country_id]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          country:countries(id, name, code),
          education_level:education_levels(id, level_name, level_code)
        `)
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          avatar_url: data.avatar_url || '',
          learner_type: data.learner_type || '',
          country_id: data.country_id || '',
          current_education_level_id: data.current_education_level_id || '',
          onboarding_completed: data.onboarding_completed || false
        });
        
        if (data.country) {
          setSelectedCountry(data.country);
        }
        if (data.education_level) {
          setSelectedEducationLevel(data.education_level);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchEducationLevels = async (countryId: string) => {
    if (!countryId) return;
    
    try {
      const { data, error } = await supabase
        .from('education_levels')
        .select('*')
        .eq('country_id', countryId)
        .order('level_name');

      if (error) throw error;
      setEducationLevels(data || []);
    } catch (error) {
      console.error('Error fetching education levels:', error);
    }
  };

  const calculateStats = () => {
    const completedCourses = courses.filter(c => c.status === 'completed').length;
    const totalHours = courses.length * 8; // Estimate 8 hours per course
    const streak = 7; // Placeholder for now

    setStats({
      totalCourses: courses.length,
      completedCourses,
      totalHours,
      streak
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLearningPreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const updateData: any = {
        id: user.id,
        learner_type: profile.learner_type,
        updated_at: new Date().toISOString()
      };

      // Only include country and education level for student learners
      if (profile.learner_type === 'student') {
        updateData.country_id = profile.country_id || null;
        updateData.current_education_level_id = profile.current_education_level_id || null;
      } else {
        // Clear country and education level for passionate learners
        updateData.country_id = null;
        updateData.current_education_level_id = null;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(updateData);

      if (error) throw error;

      // Refresh profile data to get updated values
      await fetchProfile();
      
      setIsEditingPreferences(false);
      toast({
        title: "Learning Preferences Updated",
        description: "Your learning preferences have been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update learning preferences.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (countryId: string) => {
    const country = countries.find(c => c.id === countryId);
    setSelectedCountry(country);
    setProfile(prev => ({ ...prev, country_id: countryId, current_education_level_id: '' }));
    setSelectedEducationLevel(null);
    if (countryId) {
      fetchEducationLevels(countryId);
    } else {
      setEducationLevels([]);
    }
  };

  const handleEducationLevelChange = (levelId: string) => {
    const level = educationLevels.find(l => l.id === levelId);
    setSelectedEducationLevel(level);
    setProfile(prev => ({ ...prev, current_education_level_id: levelId }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, avatar_url: data.publicUrl }));

      toast({
        title: "Avatar Uploaded",
        description: "Your profile picture has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload avatar.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 particles">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SomaVilivyo
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 pb-16">
        {/* Welcome Header */}
        <FloatingCard variant="glass" className="p-8 mb-8 shadow-large border border-white/50">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-jakarta font-bold text-gray-900 mb-2">Profile</h1>
              <p className="text-lg text-gray-600 font-inter">Manage your account settings and track your learning progress.</p>
            </div>
          </div>
        </FloatingCard>

        <div className="grid gap-8 max-w-4xl mx-auto">
          {/* Learning Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { 
                title: "Total Courses", 
                value: stats.totalCourses, 
                icon: BookOpen, 
                gradient: "from-blue-500 to-blue-600",
                description: "Enrolled courses"
              },
              { 
                title: "Completed", 
                value: stats.completedCourses, 
                icon: Trophy, 
                gradient: "from-green-500 to-green-600",
                description: "Finished courses"
              },
              { 
                title: "Learning Hours", 
                value: stats.totalHours, 
                icon: Calendar, 
                gradient: "from-purple-500 to-purple-600",
                description: "Total study time"
              },
              { 
                title: "Day Streak", 
                value: stats.streak, 
                icon: User, 
                gradient: "from-orange-500 to-orange-600",
                description: "Consecutive days"
              }
            ].map((stat, index) => (
              <FloatingCard 
                key={stat.title}
                className={`bg-gradient-to-r ${stat.gradient} text-white border-0 shadow-large overflow-hidden group cursor-pointer`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium opacity-90">{stat.title}</CardTitle>
                  <stat.icon className="h-6 w-6 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-jakarta mb-1">
                    <AnimatedCounter value={stat.value} />
                  </div>
                  <p className="text-xs opacity-80">{stat.description}</p>
                </CardContent>
              </FloatingCard>
            ))}
          </div>

          {/* Profile Information */}
          <FloatingCard variant="glass" className="shadow-large border-white/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span>Account Information</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600">Your basic account details and preferences.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-white/60 border-gray-200"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow overflow-hidden">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-white" />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg cursor-pointer flex items-center justify-center border-2 border-gray-100">
                      <Camera className="h-4 w-4 text-gray-600" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{profile.full_name || 'Set your name'}</h3>
                  <p className="text-gray-600">Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="fullName"
                      value={profile.full_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="bg-white/60"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{profile.full_name || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{profile.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex space-x-3 pt-4">
                    <Button 
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="bg-white/60"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </FloatingCard>

          {/* Learning Preferences - Onboarding Details */}
          <FloatingCard variant="glass" className="shadow-large border-white/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <Settings className="h-4 w-4 text-white" />
                    </div>
                    <span>Learning Preferences</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Manage your learner profile and curriculum alignment settings
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingPreferences(!isEditingPreferences)}
                  className="bg-white/60 border-gray-200 flex items-center gap-2"
                >
                  {isEditingPreferences ? (
                    <>
                      <X className="h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4" />
                      Edit Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Learner Type */}
              <div className="space-y-2">
                <Label htmlFor="learnerType">Learner Type</Label>
                {isEditingPreferences ? (
                  <Select 
                    value={profile.learner_type} 
                    onValueChange={(value) => setProfile(prev => ({ ...prev, learner_type: value }))}
                  >
                    <SelectTrigger className="bg-white/60">
                      <SelectValue placeholder="Select learner type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student Learner</SelectItem>
                      <SelectItem value="passionate">Passionate Learner</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                    <Brain className="h-4 w-4 text-gray-500" />
                    <span className="capitalize">
                      {profile.learner_type === 'student' ? 'Student Learner' : 
                       profile.learner_type === 'passionate' ? 'Passionate Learner' : 
                       'Not set'}
                    </span>
                  </div>
                )}
              </div>

              {/* Conditional fields for Student Learners */}
              {(profile.learner_type === 'student' || isEditingPreferences) && (
                <>
                  {/* Country Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    {isEditingPreferences ? (
                      <Select 
                        value={profile.country_id} 
                        onValueChange={handleCountryChange}
                        disabled={profile.learner_type !== 'student'}
                      >
                        <SelectTrigger className="bg-white/60">
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{selectedCountry?.name || 'Not selected'}</span>
                      </div>
                    )}
                  </div>

                  {/* Education Level Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="educationLevel">Education Level</Label>
                    {isEditingPreferences ? (
                    <Select 
                      value={profile.current_education_level_id} 
                      onValueChange={handleEducationLevelChange}
                      disabled={profile.learner_type !== 'student' || !profile.country_id}
                    >
                        <SelectTrigger className="bg-white/60">
                          <SelectValue placeholder="Select education level" />
                        </SelectTrigger>
                        <SelectContent>
                          {educationLevels.map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                              {level.level_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                        <BookOpen className="h-4 w-4 text-gray-500" />
                        <span>{selectedEducationLevel?.level_name || 'Not selected'}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Save Button for Learning Preferences */}
              {isEditingPreferences && (
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <Button 
                    onClick={handleSaveLearningPreferences}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditingPreferences(false);
                      fetchProfile(); // Reset to original values
                    }}
                    className="bg-white/60"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {/* Learning Style Insights */}
              {!isEditingPreferences && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-medium mb-4 text-gray-900">Learning Style Insights</h4>
                  {courses.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white/50 rounded-xl">
                        <h5 className="font-medium mb-2">Preferred Difficulty</h5>
                        <p className="text-sm text-gray-600">
                          {courses.map(c => c.difficulty_level).slice(0, 3).join(', ')}
                        </p>
                      </div>
                      <div className="p-4 bg-white/50 rounded-xl">
                        <h5 className="font-medium mb-2">Skill Areas</h5>
                        <p className="text-sm text-gray-600">
                          {[...new Set(courses.map(c => c.skill_area))].slice(0, 3).join(', ')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-4">
                      Complete your first course to see your learning style insights here.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </FloatingCard>
        </div>
      </div>
    </div>
  );
}
