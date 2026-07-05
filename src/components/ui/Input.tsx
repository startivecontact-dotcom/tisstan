import React from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { colors } from '@/constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...rest }: Props) {
  return (
    <View className="mb-3">
      {label ? <Text className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-mute">{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.mute}
        className={`rounded-2xl border bg-surface px-4 py-3.5 text-base text-ink ${error ? 'border-danger' : 'border-line'}`}
        {...rest}
      />
      {error ? <Text className="mt-1 text-xs text-danger">{error}</Text> : null}
    </View>
  );
}

interface FormInputProps<TForm extends FieldValues> extends TextInputProps {
  control: Control<TForm>;
  name: Path<TForm>;
  label?: string;
  rules?: object;
}

/** Input branché sur React Hook Form. */
export function FormInput<TForm extends FieldValues>({ control, name, label, rules, ...rest }: FormInputProps<TForm>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState }) => (
        <Input
          label={label}
          value={value == null ? '' : String(value)}
          onChangeText={onChange}
          onBlur={onBlur}
          error={fieldState.error?.message as string | undefined}
          {...rest}
        />
      )}
    />
  );
}
