import React from 'react';
import { Button } from '@/components/ui/button';
import { MailCheck, ArrowRight } from 'lucide-react';

const NewsletterSubscription = ({
  title,
  description,
  emailPlaceholder,
  buttonText,
  email,
  setEmail,
  handleSubscribe
}) => {
  return (
    <div className="bg-gradient-to-tr from-primary/10 via-card to-accent/10 rounded-xl shadow-lg p-6 border border-border/50">
      <div className="flex items-center mb-3">
        <MailCheck className="h-7 w-7 mr-3 text-primary" />
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{description}</p>
      <form onSubmit={handleSubscribe} className="space-y-3.5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={emailPlaceholder}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-background/70 text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          required
          aria-label={emailPlaceholder}
        />
        <Button type="submit" className="w-full btn-gradient py-2.5 rounded-lg group">
          {buttonText}
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </form>
    </div>
  );
};

export default NewsletterSubscription;
