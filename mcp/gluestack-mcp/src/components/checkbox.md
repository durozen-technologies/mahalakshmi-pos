---
title: Checkbox
description: A form control component for React & React Native that allows users to select multiple options from a set.
---

# Checkbox

A form control component for React & React Native that allows users to select multiple options from a set. Inherits all properties of React Native's View component for web and Pressable for native with className styling support.

```jsx
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxLabel,
  CheckboxIcon,
} from "@/components/ui/checkbox";
import { CheckIcon } from "@/components/ui/icon";

function Example() {
  return (
    <Checkbox>
      <CheckboxIndicator>
        <CheckboxIcon as={CheckIcon} />
      </CheckboxIndicator>
      <CheckboxLabel>Label</CheckboxLabel>
    </Checkbox>
  );
}
```

## Props

### Checkbox

- **size**: `sm` | `md` | `lg` (default: `md`)
- **value**: string - The value to be used in the checkbox input
- **onChange**: (value: boolean) => void - Function called when the state of the checkbox changes
- **defaultIsChecked**: boolean (default: `false`) - If true, the checkbox will be initially checked
- **isChecked**: boolean (default: `false`) - When true, the checkbox will be checked (controlled)
- **isDisabled**: boolean (default: `false`) - To manually set disable to the checkbox
- **isInvalid**: boolean (default: `false`) - To manually set invalid to the checkbox
- **isReadOnly**: boolean (default: `false`) - To manually set read-only to the checkbox
- **isHovered**: boolean (default: `false`) - To manually set hover to the checkbox
- **isFocusVisible**: boolean (default: `false`) - To manually set focus visible state to the checkbox
- **isIndeterminate**: boolean (default: `false`) - To manually set indeterminate to the checkbox

### CheckboxGroup

- **value**: string[] - The value of the checkbox group
- **onChange**: (values: Array<string>) => void - The callback fired when any children Checkbox is checked or unchecked
- **isDisabled**: boolean (default: `false`) - To manually set disable to the checkbox group
- **isInvalid**: boolean (default: `false`) - To manually set invalid to the checkbox group
- **isReadOnly**: boolean (default: `false`) - To manually set read-only to the checkbox group

Inherits all the properties of React Native's View component.

### CheckboxIndicator

Contains all indicators related layout style props and actions.
Inherits all the properties of React Native's View component.

### CheckboxIcon

- **forceMount**: boolean (default: `false`) - Forces mounting when more control is needed
- **as**: Required prop to specify which icon to display

Contains all Icon related layout style props and actions.
Inherits all the properties of gluestack Style's AsForwarder component.

### CheckboxLabel

Contains all Label related layout style props and actions.
Inherits all the properties of React Native's Text component.

## Default Styling

### Checkbox

<!-- BASE_STYLE_START -->

The Checkbox component uses the following base styling by default:

```css
/* Base styling applied to all Checkbox components */
flex-row items-center justify-start web:cursor-pointer data-[disabled=true]:cursor-not-allowed
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "size": {
    "lg": "gap-2",
    "md": "gap-2",
    "sm": "gap-1.5"
  }
}
```

<!-- VARIANT_STYLES_END -->

### CheckboxIndicator

<!-- BASE_STYLE_START -->

The CheckboxIndicator component uses the following base styling by default:

```css
/* Base styling applied to all CheckboxIndicator components */
justify-center items-center border-outline-400 bg-transparent rounded web:data-[focus-visible=true]:outline-none web:data-[focus-visible=true]:ring-2 web:data-[focus-visible=true]:ring-indicator-primary data-[checked=true]:bg-primary-600 data-[checked=true]:border-primary-600 data-[hover=true]:data-[checked=false]:border-outline-500 data-[hover=true]:bg-transparent data-[hover=true]:data-[invalid=true]:border-error-700 data-[hover=true]:data-[checked=true]:bg-primary-700 data-[hover=true]:data-[checked=true]:border-primary-700 data-[hover=true]:data-[checked=true]:data-[disabled=true]:border-primary-600 data-[hover=true]:data-[checked=true]:data-[disabled=true]:bg-primary-600 data-[hover=true]:data-[checked=true]:data-[disabled=true]:opacity-40 data-[hover=true]:data-[checked=true]:data-[disabled=true]:data-[invalid=true]:border-error-700 data-[hover=true]:data-[disabled=true]:border-outline-400 data-[hover=true]:data-[disabled=true]:data-[invalid=true]:border-error-700 data-[active=true]:data-[checked=true]:bg-primary-800 data-[active=true]:data-[checked=true]:border-primary-800 data-[invalid=true]:border-error-700 data-[disabled=true]:opacity-40
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to CheckboxIndicator based on the `size` prop passed to the parent Checkbox component:

```json
{
  "size": {
    "lg": "w-6 h-6 border-[3px]",
    "md": "w-5 h-5 border-2",
    "sm": "w-4 h-4 border-2"
  }
}
```

### CheckboxLabel

<!-- BASE_STYLE_START -->

The CheckboxLabel component uses the following base styling by default:

```css
/* Base styling applied to all CheckboxLabel components */
text-typography-600 data-[checked=true]:text-typography-900 data-[hover=true]:text-typography-900 data-[hover=true]:data-[checked=true]:text-typography-900 data-[hover=true]:data-[checked=true]:data-[disabled=true]:text-typography-900 data-[hover=true]:data-[disabled=true]:text-typography-400 data-[active=true]:text-typography-900 data-[active=true]:data-[checked=true]:text-typography-900 data-[disabled=true]:opacity-40 web:select-none
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to CheckboxLabel based on the `size` prop passed to the parent Checkbox component:

```json
{
  "size": {
    "lg": "text-lg",
    "md": "text-base",
    "sm": "text-sm"
  }
}
```

### CheckboxIcon

<!-- BASE_STYLE_START -->

The CheckboxIcon component uses the following base styling by default:

```css
/* Base styling applied to all CheckboxIcon components */
text-typography-50 fill-none
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to CheckboxIcon based on the `size` prop passed to the parent Checkbox component:

```json
{
  "size": {
    "sm": "h-3 w-3",
    "md": "h-4 w-4",
    "lg": "h-5 w-5"
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
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxLabel,
  CheckboxIcon,
  CheckboxGroup,
} from "@/components/ui/checkbox";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { CheckIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

function Example() {
  const [values, setValues] = React.useState(["UX Research"]);

  return (
    <VStack space="xl">
      <CheckboxGroup
        value={values}
        onChange={(keys) => {
          setValues(keys);
        }}
        className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <VStack space="md" className="w-full">
          <Checkbox
            size="sm"
            value="UX Research"
            className="flex items-center p-2 data-[hover=true]:bg-gray-50 rounded cursor-pointer"
          >
            <CheckboxIndicator className="mr-3 h-5 w-5 border border-gray-300 rounded bg-white text-blue-500 flex items-center justify-center">
              <CheckboxIcon as={CheckIcon} className="h-3 w-3" />
            </CheckboxIndicator>
            <CheckboxLabel className="text-gray-700 select-none font-medium">
              UX Research
            </CheckboxLabel>
          </Checkbox>

          <Checkbox
            size="sm"
            value="Software"
            className="flex items-center p-2 data-[hover=true]:bg-gray-50 rounded cursor-pointer"
          >
            <CheckboxIndicator className="mr-3 h-5 w-5 border border-gray-300 rounded bg-white text-blue-500 flex items-center justify-center">
              <CheckboxIcon as={CheckIcon} className="h-3 w-3" />
            </CheckboxIndicator>
            <CheckboxLabel className="text-gray-700 select-none font-medium">
              Software Development
            </CheckboxLabel>
          </Checkbox>
        </VStack>
      </CheckboxGroup>
    </VStack>
  );
}
```
