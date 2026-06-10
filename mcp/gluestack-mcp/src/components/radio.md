---
title: Radio
description: A radio button component for React & React Native that allows users to select a single option from a set.
---

# Radio

A radio button component for React & React Native that allows users to select a single option from a set. Inherits all properties of React Native's View component for web and Pressable for native with className styling support.

```jsx
import {
  Radio,
  RadioGroup,
  RadioIndicator,
  RadioLabel,
  RadioIcon,
} from "@/components/ui/radio";
import { CircleIcon } from "@/components/ui/icon";

function Example() {
  return (
    <RadioGroup>
      <Radio value="option1" size="md" isInvalid={false} isDisabled={false}>
        <RadioIndicator>
          <RadioIcon as={CircleIcon} />
        </RadioIndicator>
        <RadioLabel>Label</RadioLabel>
      </Radio>
    </RadioGroup>
  );
}
```

## Props

### Radio

- **size**: `sm` | `md` | `lg` (default: `md`)
- **value**: string - The value to be used in the radio input
- **onChange**: function - Function called when the state of the radio changes
- **isDisabled**: boolean (default: `false`) - To manually set disable to the radio
- **isInvalid**: boolean (default: `false`) - To manually set invalid to the radio
- **isHovered**: boolean (default: `false`) - To manually set hover to the radio
- **isFocusVisible**: boolean (default: `false`) - To manually set focus visible state to the radio
- **isIndeterminate**: boolean (default: `false`) - To manually set indeterminate to the radio

Inherits all the properties of React Native's View component.

### RadioGroup

- **value**: string - The value of the radio group
- **onChange**: function - The callback fired when any children Radio is checked or unchecked
- **isReadOnly**: boolean (default: `false`) - To manually set read-only to the radio group

Inherits all the properties of React Native's View component.

### RadioIndicator

Contains all Indicator related layout style props and actions.
Inherits all the properties of React Native's View component.

### RadioIcon

- **forceMount**: boolean (default: `false`) - Forces mounting when more control is needed
- **as**: Required prop to specify which icon to display

Contains all Icon related layout style props and actions.
Inherits all the properties of gluestack Style's AsForwarder component.

### RadioLabel

Contains all Label related layout style props and actions.
Inherits all the properties of React Native's Text component.

## Default Styling

### Radio

<!-- BASE_STYLE_START -->

The Radio component uses the following base styling by default:

```css
/* Base styling applied to all Radio components */
group/radio flex-row justify-start items-center web:cursor-pointer data-[disabled=true]:web:cursor-not-allowed
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "size": {
    "sm": "gap-1.5",
    "md": "gap-2",
    "lg": "gap-2"
  }
}
```

<!-- VARIANT_STYLES_END -->

### RadioGroup

<!-- BASE_STYLE_START -->

The RadioGroup component uses the following base styling by default:

```css
/* Base styling applied to all RadioGroup components */
gap-2
```

<!-- BASE_STYLE_END -->

### RadioIndicator

<!-- BASE_STYLE_START -->

The RadioIndicator component uses the following base styling by default:

```css
/* Base styling applied to all RadioIndicator components */
justify-center items-center bg-transparent border-outline-400 border-2 rounded-full data-[focus-visible=true]:web:outline-2 data-[focus-visible=true]:web:outline-primary-700 data-[focus-visible=true]:web:outline data-[checked=true]:border-primary-600 data-[checked=true]:bg-transparent data-[hover=true]:border-outline-500 data-[hover=true]:bg-transparent data-[hover=true]:data-[checked=true]:bg-transparent data-[hover=true]:data-[checked=true]:border-primary-700 data-[hover=true]:data-[invalid=true]:border-error-700 data-[hover=true]:data-[disabled=true]:opacity-40 data-[hover=true]:data-[disabled=true]:border-outline-400 data-[hover=true]:data-[disabled=true]:data-[invalid=true]:border-error-400 data-[active=true]:bg-transparent data-[active=true]:border-primary-800 data-[invalid=true]:border-error-700 data-[disabled=true]:opacity-40 data-[disabled=true]:data-[checked=true]:border-outline-400 data-[disabled=true]:data-[checked=true]:bg-transparent data-[disabled=true]:data-[invalid=true]:border-error-400
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to RadioIndicator based on the `size` prop passed to the parent Radio component:

```json
{
  "size": {
    "sm": "h-4 w-4",
    "md": "h-5 w-5",
    "lg": "h-6 w-6"
  }
}
```

### RadioIcon

<!-- BASE_STYLE_START -->

The RadioIcon component uses the following base styling by default:

```css
/* Base styling applied to all RadioIcon components */
rounded-full justify-center items-center text-primary-800 fill-primary-800
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to RadioIcon based on the `size` prop passed to the parent Radio component:

```json
{
  "size": {
    "sm": "h-[9px] w-[9px]",
    "md": "h-3 w-3",
    "lg": "h-4 w-4"
  }
}
```

### RadioLabel

<!-- BASE_STYLE_START -->

The RadioLabel component uses the following base styling by default:

```css
/* Base styling applied to all RadioLabel components */
text-typography-600 data-[checked=true]:text-typography-900 data-[hover=true]:text-typography-900 data-[hover=true]:data-[disabled=true]:text-typography-600 data-[hover=true]:data-[disabled=true]:data-[checked=true]:text-typography-900 data-[active=true]:text-typography-900 data-[active=true]:data-[checked=true]:text-typography-900 data-[disabled=true]:opacity-40 web:select-none
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to RadioLabel based on the `size` prop passed to the parent Radio component:

```json
{
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

## Accessibility

- Keyboard navigation support with Tab, Shift+Tab, and Space keys
- Screen reader compatibility with appropriate ARIA attributes
- Support for focus management and various states (error, disabled, required)

## Examples

```jsx
import React from "react";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import {
  Radio,
  RadioGroup,
  RadioIndicator,
  RadioLabel,
  RadioIcon,
} from "@/components/ui/radio";
import { CircleIcon } from "@/components/ui/icon";

function Example() {
  const [paymentMethod, setPaymentMethod] = React.useState("Cash On Delivery");
  const [preferredContact, setPreferredContact] = React.useState("email");

  return (
    <RadioGroup
      value={paymentMethod}
      onChange={setPaymentMethod}
      className="p-4 bg-gray-50 rounded-lg"
    >
      <Text className="font-medium mb-2">Payment Method</Text>
      <HStack space="2xl" className="flex-wrap md:flex-nowrap">
        <Radio
          value="Credit Card"
          className="flex items-center p-3 rounded-md data-[hover=true]:bg-gray-100 transition-colors cursor-pointer"
        >
          <RadioIndicator className="mr-2 h-5 w-5 text-blue-500 border border-gray-300 rounded-full">
            <RadioIcon as={CircleIcon} className="h-3 w-3" />
          </RadioIndicator>
          <RadioLabel className="text-gray-700 font-medium select-none">
            Credit Card
          </RadioLabel>
        </Radio>

        <Radio
          value="Cash On Delivery"
          className="flex items-center p-3 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <RadioIndicator className="mr-2 h-5 w-5 text-blue-500 border border-gray-300 rounded-full">
            <RadioIcon as={CircleIcon} className="h-3 w-3" />
          </RadioIndicator>
          <RadioLabel className="text-gray-700 font-medium select-none">
            Cash On Delivery
          </RadioLabel>
        </Radio>
      </HStack>
    </RadioGroup>
  );
}
```
