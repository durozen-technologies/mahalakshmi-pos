---
title: Textarea
description: A multi-line input component for React & React Native with customizable properties.
---

# Textarea

A multi-line input component for React & React Native with customizable properties. Inherits all properties of React Native's View component with className styling support.

```jsx
import { Textarea, TextareaInput } from "@/components/ui/textarea";

function Example() {
  return (
    <Textarea
      size="md"
      isReadOnly={false}
      isInvalid={false}
      isDisabled={false}
      className="w-64"
    >
      <TextareaInput placeholder="Your text goes here..." />
    </Textarea>
  );
}
```

## Props

### Textarea

- **size**: `sm` | `md` | `lg` | `xl` (default: `md`)
- **isInvalid**: boolean (default: `false`) - When true, the input displays an error state
- **isDisabled**: boolean (default: `false`) - When true, the input is disabled and cannot be edited
- **isHovered**: boolean (default: `false`) - When true, the input displays a hover state
- **isFocused**: boolean (default: `false`) - When true, the input displays a focus state
- **isRequired**: boolean (default: `false`) - If true, sets aria-required="true" on the input
- **isReadOnly**: boolean (default: `false`) - If true, the input value cannot be edited

### TextareaInput

Contains all TextInput related layout style props and actions.
Inherits all the properties of React Native's TextInput component.

## Default Styling

### Textarea

<!-- BASE_STYLE_START -->

The Textarea component uses the following base styling by default:

```css
/* Base styling applied to all Textarea components */
w-full h-[100px] border border-background-300 rounded data-[hover=true]:border-outline-400 data-[focus=true]:border-primary-700 data-[focus=true]:data-[hover=true]:border-primary-700 data-[disabled=true]:opacity-40 data-[disabled=true]:bg-background-50 data-[disabled=true]:data-[hover=true]:border-background-300
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "variant": {
    "default": "data-[focus=true]:border-primary-700 data-[focus=true]:web:ring-1 data-[focus=true]:web:ring-inset data-[focus=true]:web:ring-indicator-primary data-[invalid=true]:border-error-700 data-[invalid=true]:web:ring-1 data-[invalid=true]:web:ring-inset data-[invalid=true]:web:ring-indicator-error data-[invalid=true]:data-[hover=true]:border-error-700 data-[invalid=true]:data-[focus=true]:data-[hover=true]:border-primary-700 data-[invalid=true]:data-[focus=true]:data-[hover=true]:web:ring-1 data-[invalid=true]:data-[focus=true]:data-[hover=true]:web:ring-inset data-[invalid=true]:data-[focus=true]:data-[hover=true]:web:ring-indicator-primary data-[invalid=true]:data-[disabled=true]:data-[hover=true]:border-error-700 data-[invalid=true]:data-[disabled=true]:data-[hover=true]:web:ring-1 data-[invalid=true]:data-[disabled=true]:data-[hover=true]:web:ring-inset data-[invalid=true]:data-[disabled=true]:data-[hover=true]:web:ring-indicator-error "
  },
  "size": {
    "sm": "",
    "md": "",
    "lg": "",
    "xl": ""
  }
}
```

<!-- VARIANT_STYLES_END -->

### TextareaInput

<!-- BASE_STYLE_START -->

The TextareaInput component uses the following base styling by default:

```css
/* Base styling applied to all TextareaInput components */
p-2 web:outline-0 web:outline-none flex-1 color-typography-900 align-text-top placeholder:text-typography-500 web:cursor-text web:data-[disabled=true]:cursor-not-allowed
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to TextareaInput based on the `size` prop passed to the parent Textarea component:

```json
{
  "size": {
    "sm": "text-sm",
    "md": "text-base",
    "lg": "text-lg",
    "xl": "text-xl"
  }
}
```

## Accessibility

- Keyboard navigation support
- Screen reader compatibility with appropriate ARIA attributes
- Support for disabled and read-only states

## Examples

```jsx
import React, { useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorText,
} from "@/components/ui/form-control";

function Example() {
  return (
    <VStack space="md">
      <Text className="font-medium">States</Text>

      <Textarea isInvalid={true}>
        <TextareaInput placeholder="Invalid textarea" />
      </Textarea>
      <FormControl isInvalid={true}>
        <FormControlError>
          <FormControlErrorText>This field is required</FormControlErrorText>
        </FormControlError>
      </FormControl>

      <Textarea isDisabled={true}>
        <TextareaInput placeholder="Disabled textarea" />
      </Textarea>

      <Textarea isReadOnly={true}>
        <TextareaInput
          value="This content cannot be edited"
          placeholder="Read-only textarea"
        />
      </Textarea>
    </VStack>
  );
}
```
