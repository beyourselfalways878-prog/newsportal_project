import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

const AuthModal = ({ isOpen, setIsOpen }) => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const resetFormFields = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
  }

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    } else {
      toast({
        title: 'Login Successful!',
        description: 'Welcome back!',
      });
      setIsOpen(false);
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const { error } = await signUp(email, password, fullName);
    if (error) {
      setError(error.message);
    } else {
      setIsSuccess(true);
      toast({
        title: 'Signup Successful!',
        description: 'Please check your email to verify your account.',
      });
    }
    setIsLoading(false);
  };

  const resetState = () => {
    resetFormFields();
    setIsLoading(false);
    setIsSuccess(false);
    setActiveTab("login");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{isSuccess ? "Check your email" : "Authentication"}</DialogTitle>
          <DialogDescription>
            {isSuccess ? "We've sent a verification link to your email address." : "Log in or create an account to continue."}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="p-6 pt-0">
            <Button className="w-full" onClick={() => setIsOpen(false)}>Close</Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); resetFormFields(); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="p-6">
              <form onSubmit={handleSignIn}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  {error && <div className="text-destructive text-sm flex items-center"><AlertCircle className="h-4 w-4 mr-2"/>{error}</div>}
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Login
                  </Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="p-6">
              <form onSubmit={handleSignUp}>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="signup-fullname">Full Name</Label>
                      <Input id="signup-fullname" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  {error && <div className="text-destructive text-sm flex items-center"><AlertCircle className="h-4 w-4 mr-2"/>{error}</div>}
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
