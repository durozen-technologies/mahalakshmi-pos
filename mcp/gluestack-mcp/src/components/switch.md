---
title: Switch
description: Toggle component that inherits React Native Switch properties with className styling support.
---

# Switch

A toggle component for React & React Native that allows users to turn options on or off. Inherits all properties of React Native Switch component and supports className for styling.

```jsx
import { Switch } from "@/components/ui/switch";
import colors from "tailwindcss/colors";

function Example() {
  return (
    <Switch
      trackColor={{ false: colors.neutral[300], true: colors.neutral[600] }}
      thumbColor={colors.neutral[50]}
      activeThumbColor={colors.neutral[50]}
      ios_backgroundColor={colors.neutral[300]}
    />
  );
}
```

## Props

- **size**: `sm` | `md` | `lg` (default: `md`)
- **isDisabled**: boolean (default: `false`) - When true, the switch is disabled and cannot be toggled
- **isInvalid**: boolean (default: `false`) - When true, the switch displays an error state
- **isRequired**: boolean (default: `false`) - When true, sets aria-required="true" on the switch
- **isHovered**: boolean (default: `false`) - When true, the switch displays a hover state
- **value**: boolean (default: `false`) - The value of the switch. If true the switch will be turned on
- **defaultValue**: boolean (default: `false`) - The defaultValue of the switch. If true the switch will be turned on initially
- **onToggle**: () => any - Callback to be invoked when switch value is changed
- **trackColor**: { false: string, true: string } - Colors for the track depending on whether the switch is on or off
- **thumbColor**: string - Color of the foreground switch grip
- **activeThumbColor**: string - Color of the foreground switch grip when active
- **ios_backgroundColor**: string - Background color when the switch is turned off (iOS only)

## Default Styling

<!-- BASE_STYLE_START -->

The Switch component uses the following base styling by default:

```css
/* Base styling applied to all Switch components */
data-[focus=true]:outline-0 data-[focus=true]:ring-2 data-[focus=true]:ring-indicator-primary web:cursor-pointer disabled:cursor-not-allowed data-[disabled=true]:opacity-40 data-[invalid=true]:border-error-700 data-[invalid=true]:rounded-xl data-[invalid=true]:border-2
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "size": {
    "sm": "scale-75",
    "md": "",
    "lg": "scale-125"
  }
}
```

<!-- VARIANT_STYLES_END -->

## Accessibility

- Keyboard navigation support with Tab and Space keys
- Screen reader compatibility with appropriate ARIA attributes
- Support for disabled and invalid states

## Examples

```jsx
import { HStack } from "@/components/ui/hstack";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import colors from "tailwindcss/colors";

function Example() {
  return (
    <VStack space="lg">
      <HStack
        space="md"
        className="items-center p-3 rounded-md bg-white shadow-sm"
      >
        <Switch
          trackColor={{ false: colors.gray[300], true: colors.gray[500] }}
          thumbColor={colors.gray[50]}
          activeThumbColor={colors.gray[50]}
          ios_backgroundColor={colors.gray[300]}
          size="lg"
          isDisabled={true}
        />
        <Text size="lg" className="text-typography-700 cursor-pointer">
          Allow notifications
        </Text>
      </HStack>
    </VStack>
  );
}
```
