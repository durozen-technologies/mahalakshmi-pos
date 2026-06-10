---
title: Input
description: A flexible input component with validation and styling options.
---

# Input

A flexible input component with validation and styling options. Inherits all properties of React Native's View component with className styling support.

```jsx
import { Input, InputField } from "@/components/ui/input";

function Example() {
  return (
    <Input>
      <InputField placeholder="Enter text here..." />
    </Input>
  );
}
```

## Props

### Input

- **variant**: `underlined` | `outline` | `rounded` (default: `outline`)
- **size**: `sm` | `md` | `lg` | `xl` (default: `md`)
- **isInvalid**: boolean (default: `false`)
- **isDisabled**: boolean (default: `false`)
- **isReadOnly**: boolean (default: `false`)

### InputField

Main text entry component with type prop (`text` | `password`). Inherits all the properties of React Native's TextInput component.

### InputIcon

For adding icons inside inputs. Inherits all the properties of gluestack Style's AsForwarder component.

### InputSlot

Container for buttons or icons within inputs. Inherits all the properties of React Native's Pressable component.

## Default Styling

### Input

<!-- BASE_STYLE_START -->

The Input component uses the following base styling by default:

```css
/* Base styling applied to all Input components */
border-background-300 flex-row overflow-hidden content-center data-[hover=true]:border-outline-400 data-[focus=true]:border-primary-700 data-[focus=true]:hover:border-primary-700 data-[disabled=true]:opacity-40 data-[disabled=true]:hover:border-background-300 items-center
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "size": {
    "xl": "h-12",
    "lg": "h-11",
    "md": "h-10",
    "sm": "h-9"
  },
  "variant": {
    "underlined": "rounded-none border-b data-[invalid=true]:border-b-2 data-[invalid=true]:border-error-700 data-[invalid=true]:hover:border-error-700 data-[invalid=true]:data-[focus=true]:border-error-700 data-[invalid=true]:data-[focus=true]:hover:border-error-700 data-[invalid=true]:data-[disabled=true]:hover:border-error-700",
    "outline": "rounded border data-[invalid=true]:border-error-700 data-[invalid=true]:hover:border-error-700 data-[invalid=true]:data-[focus=true]:border-error-700 data-[invalid=true]:data-[focus=true]:hover:border-error-700 data-[invalid=true]:data-[disabled=true]:hover:border-error-700 data-[focus=true]:web:ring-1 data-[focus=true]:web:ring-inset data-[focus=true]:web:ring-indicator-primary data-[invalid=true]:web:ring-1 data-[invalid=true]:web:ring-inset data-[invalid=true]:web:ring-indicator-error data-[invalid=true]:data-[focus=true]:hover:web:ring-1 data-[invalid=true]:data-[focus=true]:hover:web:ring-inset data-[invalid=true]:data-[focus=true]:hover:web:ring-indicator-error data-[invalid=true]:data-[disabled=true]:hover:web:ring-1 data-[invalid=true]:data-[disabled=true]:hover:web:ring-inset data-[invalid=true]:data-[disabled=true]:hover:web:ring-indicator-error",
    "rounded": "rounded-full border data-[invalid=true]:border-error-700 data-[invalid=true]:hover:border-error-700 data-[invalid=true]:data-[focus=true]:border-error-700 data-[invalid=true]:data-[focus=true]:hover:border-error-700 data-[invalid=true]:data-[disabled=true]:hover:border-error-700 data-[focus=true]:web:ring-1 data-[focus=true]:web:ring-inset data-[focus=true]:web:ring-indicator-primary data-[invalid=true]:web:ring-1 data-[invalid=true]:web:ring-inset data-[invalid=true]:web:ring-indicator-error data-[invalid=true]:data-[focus=true]:hover:web:ring-1 data-[invalid=true]:data-[focus=true]:hover:web:ring-inset data-[invalid=true]:data-[focus=true]:hover:web:ring-indicator-error data-[invalid=true]:data-[disabled=true]:hover:web:ring-1 data-[invalid=true]:data-[disabled=true]:hover:web:ring-inset data-[invalid=true]:data-[disabled=true]:hover:web:ring-indicator-error"
  }
}
```

<!-- VARIANT_STYLES_END -->

### InputField

<!-- BASE_STYLE_START -->

The InputField component uses the following base styling by default:

```css
/* Base styling applied to all InputField components */
flex-1 text-typography-900 py-0 px-3 placeholder:text-typography-500 h-full ios:leading-[0px] web:cursor-text web:data-[disabled=true]:cursor-not-allowed
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to InputField based on the props passed to the parent Input component:

```json
{
  "variant": {
    "underlined": "web:outline-0 web:outline-none px-0",
    "outline": "web:outline-0 web:outline-none",
    "rounded": "web:outline-0 web:outline-none px-4"
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
  }
}
```

### InputIcon

<!-- BASE_STYLE_START -->

The InputIcon component uses the following base styling by default:

```css
/* Base styling applied to all InputIcon components */
justify-center items-center text-typography-400 fill-none
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to InputIcon based on the size prop passed to the parent Input component:

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

### InputSlot

<!-- BASE_STYLE_START -->

The InputSlot component uses the following base styling by default:

```css
/* Base styling applied to all InputSlot components */
justify-center items-center web:disabled:cursor-not-allowed
```

<!-- BASE_STYLE_END -->

## Examples

```jsx
import React from "react";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { EyeIcon, EyeOffIcon, SearchIcon } from "@/components/ui/icon";

function Example() {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <VStack space="xl" className="w-full max-w-md">
      {/* Input with icon */}
      <Input variant="underlined">
        <InputSlot className="pl-3">
          <InputIcon as={SearchIcon} />
        </InputSlot>
        <InputField placeholder="Search..." />
      </Input>

      {/* Password input with toggle icon */}
      <Input>
        <InputField
          type={showPassword ? "text" : "password"}
          placeholder="Enter password"
        />
        <InputSlot className="pr-3" onPress={handleShowPassword}>
          <InputIcon as={showPassword ? EyeIcon : EyeOffIcon} />
        </InputSlot>
      </Input>
    </VStack>
  );
}
```
