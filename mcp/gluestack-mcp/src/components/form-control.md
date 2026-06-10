---
title: FormControl
description: A component to build accessible form fields with labels, helper text, and error handling.
---

# FormControl

A component to build accessible form fields with labels, helper text, and error handling. Inherits all properties of React Native's View component with className styling support.

```jsx
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { AlertCircleIcon } from "@/components/ui/icon";

function Example() {
  return (
    <FormControl>
      <FormControlLabel>
        <FormControlLabelText>Email</FormControlLabelText>
      </FormControlLabel>
      <Input>
        <InputField placeholder="Enter your email" />
      </Input>
      <FormControlHelper>
        <FormControlHelperText>
          Enter a valid email address
        </FormControlHelperText>
      </FormControlHelper>
      <FormControlError>
        <FormControlErrorIcon as={AlertCircleIcon} />
        <FormControlErrorText>Email is required</FormControlErrorText>
      </FormControlError>
    </FormControl>
  );
}
```

## Props

### FormControl

- **isInvalid**: boolean (default: `false`) - shows error state
- **isRequired**: boolean (default: `false`) - adds required indicator
- **isDisabled**: boolean (default: `false`) - disables the form field
- **isReadOnly**: boolean (default: `false`) - makes the form field read-only
- **size**: `sm` | `md` | `lg` (default: `md`)

## Child Components

### FormControlLabel

Container for the label. Inherits all the properties of React Native's View component.

### FormControlLabelText

Text content of the label. Inherits all the properties of React Native's Text component.

### FormControlHelper

Container for helper text. Inherits all the properties of React Native's View component.

### FormControlHelperText

Text content for helper message. Inherits all the properties of React Native's Text component.

### FormControlError

Container for error message (shown when isInvalid is true). Inherits all the properties of React Native's View component.

### FormControlErrorText

Text content for error message. Inherits all the properties of React Native's Text component.

### FormControlErrorIcon

Icon for error message. Inherits all the properties of gluestack Style's AsForwarder component.

## Default Styling

### FormControl

<!-- BASE_STYLE_START -->

The FormControl component uses the following base styling by default:

```css
/* Base styling applied to all FormControl components */
flex flex-col
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "size": {
    "sm": "",
    "md": "",
    "lg": ""
  }
}
```

<!-- VARIANT_STYLES_END -->

### FormControlLabel

<!-- BASE_STYLE_START -->

The FormControlLabel component uses the following base styling by default:

```css
/* Base styling applied to all FormControlLabel components */
flex flex-row justify-start items-center mb-1
```

<!-- BASE_STYLE_END -->

### FormControlLabelText

<!-- BASE_STYLE_START -->

The FormControlLabelText component uses the following base styling by default:

```css
/* Base styling applied to all FormControlLabelText components */
font-medium text-typography-900
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "isTruncated": {
    "true": "web:truncate"
  },
  "bold": {
    "true": "font-bold"
  },
  "underline": {
    "true": "underline"
  },
  "strikeThrough": {
    "true": "line-through"
  },
  "size": {
    "2xs": "text-2xs",
    "xs": "text-xs",
    "sm": "text-sm",
    "md": "text-base",
    "lg": "text-lg",
    "xl": "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
    "6xl": "text-6xl"
  },
  "sub": {
    "true": "text-xs"
  },
  "italic": {
    "true": "italic"
  },
  "highlight": {
    "true": "bg-yellow-500"
  }
}
```

<!-- VARIANT_STYLES_END -->

### FormControlHelper

<!-- BASE_STYLE_START -->

The FormControlHelper component uses the following base styling by default:

```css
/* Base styling applied to all FormControlHelper components */
flex flex-row justify-start items-center mt-1
```

<!-- BASE_STYLE_END -->

### FormControlHelperText

<!-- BASE_STYLE_START -->

The FormControlHelperText component uses the following base styling by default:

```css
/* Base styling applied to all FormControlHelperText components */
text-typography-500
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "isTruncated": {
    "true": "web:truncate"
  },
  "bold": {
    "true": "font-bold"
  },
  "underline": {
    "true": "underline"
  },
  "strikeThrough": {
    "true": "line-through"
  },
  "size": {
    "2xs": "text-2xs",
    "xs": "text-xs",
    "sm": "text-xs",
    "md": "text-sm",
    "lg": "text-base",
    "xl": "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
    "6xl": "text-6xl"
  },
  "sub": {
    "true": "text-xs"
  },
  "italic": {
    "true": "italic"
  },
  "highlight": {
    "true": "bg-yellow-500"
  }
}
```

<!-- VARIANT_STYLES_END -->

### FormControlError

<!-- BASE_STYLE_START -->

The FormControlError component uses the following base styling by default:

```css
/* Base styling applied to all FormControlError components */
flex flex-row justify-start items-center mt-1 gap-1
```

<!-- BASE_STYLE_END -->

### FormControlErrorText

<!-- BASE_STYLE_START -->

The FormControlErrorText component uses the following base styling by default:

```css
/* Base styling applied to all FormControlErrorText components */
text-error-700
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "isTruncated": {
    "true": "web:truncate"
  },
  "bold": {
    "true": "font-bold"
  },
  "underline": {
    "true": "underline"
  },
  "strikeThrough": {
    "true": "line-through"
  },
  "size": {
    "2xs": "text-2xs",
    "xs": "text-xs",
    "sm": "text-sm",
    "md": "text-base",
    "lg": "text-lg",
    "xl": "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
    "6xl": "text-6xl"
  },
  "sub": {
    "true": "text-xs"
  },
  "italic": {
    "true": "italic"
  },
  "highlight": {
    "true": "bg-yellow-500"
  }
}
```

<!-- VARIANT_STYLES_END -->

### FormControlErrorIcon

<!-- BASE_STYLE_START -->

The FormControlErrorIcon component uses the following base styling by default:

```css
/* Base styling applied to all FormControlErrorIcon components */
text-error-700 fill-none
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "size": {
    "2xs": "h-3 w-3",
    "xs": "h-3.5 w-3.5",
    "sm": "h-4 w-4",
    "md": "h-[18px] w-[18px]",
    "lg": "h-5 w-5",
    "xl": "h-6 w-6"
  }
}
```

<!-- VARIANT_STYLES_END -->

## Example

```jsx
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { AlertCircleIcon } from "@/components/ui/icon";

function Example() {
  return (
    <FormControl className="max-w-md mx-auto my-4 p-4 bg-background-50 rounded-lg shadow-sm">
      <FormControlLabel className="mb-1">
        <FormControlLabelText className="font-medium text-typography-700">
          Email
        </FormControlLabelText>
      </FormControlLabel>
      <Input className="border-outline-300 transition-colors duration-200">
        <InputField
          placeholder="Enter your email"
          className="text-typography-800 placeholder:text-typography-400"
        />
      </Input>
      <FormControlHelper className="mt-1">
        <FormControlHelperText size="xs" className="text-typography-500">
          Enter a valid email address
        </FormControlHelperText>
      </FormControlHelper>
      <FormControlError className="mt-2 flex items-center">
        <FormControlErrorIcon
          as={AlertCircleIcon}
          className="stroke-red-500 w-4 h-4 mr-1"
        />
        <FormControlErrorText size="sm" className="text-red-500">
          Email is required
        </FormControlErrorText>
      </FormControlError>
    </FormControl>
  );
}
```
