"use client";
import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  deadline: string;
}

export default function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const difference = deadlineTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds, isExpired: false };
      } else {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft.isExpired) {
    return null;
  }

  return (
    <div className="card p-6 text-center bg-brand-cyan/10 border-brand-cyan/30">
      <div className="text-brand-cyan text-lg font-bold mb-4">
        ⏰ Next Gameweek Deadline
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{timeLeft.days}</div>
          <div className="text-xs text-white/60">Days</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{timeLeft.hours}</div>
          <div className="text-xs text-white/60">Hours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{timeLeft.minutes}</div>
          <div className="text-xs text-white/60">Minutes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{timeLeft.seconds}</div>
          <div className="text-xs text-white/60">Seconds</div>
        </div>
      </div>
      
      <div className="text-brand-cyan text-sm mt-4">
        {new Date(deadline).toLocaleString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
}
