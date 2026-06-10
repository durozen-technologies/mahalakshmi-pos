---
title: Icon
description: A scalable icon component for React Native and web applications with built-in icons collection.
---

# Icon

A scalable icon component for React Native and web applications with built-in icons collection and classNames for styling.

```jsx
import { Icon, EditIcon } from "@/components/ui/icon";

function Example() {
  return <Icon as={EditIcon} size="md" />;
}
```

## Props

- **size**: `2xs` | `xs` | `sm` | `md` | `lg` | `xl` (default: `md`)
- **as**: Required prop to specify which icon to display
- All SVG props are supported

## Default Styling

<!-- BASE_STYLE_START -->

The Icon component uses the following base styling by default:

```css
/* Base styling applied to all Icon components */
text-typography-950 fill-none pointer-events-none
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

## Built-in Icons

The library includes many common icons:
AddIcon, AlertCircleIcon, ArrowUpIcon, ArrowDownIcon, ArrowRightIcon, ArrowLeftIcon, AtSignIcon, BellIcon, CalendarDaysIcon, CheckIcon, CheckCircleIcon, ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon, ChevronsUpDownIcon, CircleIcon, ClockIcon, CloseIcon, CloseCircleIcon, CopyIcon, DownloadIcon, EditIcon, EyeIcon, EyeOffIcon, FavouriteIcon, GlobeIcon, GripVerticalIcon, HelpCircleIcon, InfoIcon, LinkIcon, ExternalLinkIcon, LoaderIcon, LockIcon, MailIcon, MenuIcon, MessageCircleIcon, MoonIcon, PaperclipIcon, PhoneIcon, PlayIcon, RemoveIcon, RepeatIcon, Repeat1Icon, SearchIcon, SettingsIcon, ShareIcon, SlashIcon, StarIcon, SunIcon, ThreeDotsIcon, TrashIcon, UnlockIcon

Note: For icons not available in the built-in collection, you have to strictly import them from the 'lucide-react-native' only not from any other library.

## Examples

### Usage with Lucide Icons

```jsx
import { Icon } from "@/components/ui/icon";
import { Box } from "@/components/ui/box";
import { Camera, Instagram } from "lucide-react-native";

function Example() {
  return (
    <Box className="flex space-x-4 items-center p-4 bg-gray-100 rounded-lg">
      <Icon as={Camera} size="xl" className="text-blue-500" />
      <Icon as={Instagram} className="w-8 h-8 fill-purple-600" />
    </Box>
  );
}
```

### Custom Icons

Create custom icons using the createIcon function:

```jsx
import { Icon, createIcon } from "@/components/ui/icon";
import { Path } from "react-native-svg";

function Example() {
  const CustomIcon = createIcon({
    viewBox: "0 0 24 24",
    path: (
      <Path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  });

  return <Icon as={CustomIcon} size="sm" />;
}
```
