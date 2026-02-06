import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function useCountdown(targetDate: string): TimeLeft {
  const calculateTimeLeft = (): TimeLeft => {
    const difference = new Date(targetDate).getTime() - new Date().getTime();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

export function formatCountdown(timeLeft: TimeLeft): string {
  if (timeLeft.total <= 0) {
    return 'Ended';
  }

  if (timeLeft.days > 0) {
    return `${timeLeft.days}d ${timeLeft.hours}h left`;
  }

  if (timeLeft.hours > 0) {
    return `${timeLeft.hours}h ${timeLeft.minutes}m left`;
  }

  return `${timeLeft.minutes}m ${timeLeft.seconds}s left`;
}

export function getCountdownStatus(timeLeft: TimeLeft): 'urgent' | 'soon' | 'normal' {
  if (timeLeft.total <= 0) return 'urgent';
  if (timeLeft.days < 3) return 'urgent';
  if (timeLeft.days < 7) return 'soon';
  return 'normal';
}
