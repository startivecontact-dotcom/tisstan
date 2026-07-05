import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'mute' | 'stat';

const STYLES: Record<Variant, string> = {
  title: 'text-ink text-3xl font-bold tracking-tight',
  heading: 'text-ink text-lg font-semibold',
  body: 'text-ink text-base',
  label: 'text-mute text-xs font-semibold uppercase tracking-widest',
  mute: 'text-mute text-sm',
  stat: 'text-ink text-2xl font-bold',
};

interface Props extends TextProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}

export function T({ variant = 'body', className = '', children, ...rest }: Props) {
  return (
    <RNText className={`${STYLES[variant]} ${className}`} {...rest}>
      {children}
    </RNText>
  );
}
