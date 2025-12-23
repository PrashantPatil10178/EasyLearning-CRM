import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCommand,
  IconCreditCard,
  IconFile,
  IconFileText,
  IconHelpCircle,
  IconPhoto,
  IconDeviceLaptop,
  IconLayoutDashboard,
  IconLoader2,
  IconLogin,
  IconShoppingBag,
  IconMoon,
  IconDotsVertical,
  IconPizza,
  IconPlus,
  IconSettings,
  IconSun,
  IconTrash,
  IconBrandTwitter,
  IconUser,
  IconUserCircle,
  IconUserEdit,
  IconUserX,
  IconX,
  IconLayoutKanban,
  IconBrandGithub,
  IconUsers,
  IconChartBar,
  IconCircleDot,
  IconClock,
  IconPhone,
  IconPhoneCall,
  IconBriefcase,
  IconCheckbox,
  IconChecklist,
  IconSpeakerphone,
  IconUsersGroup,
  IconSchool,
  IconCalendar,
  IconMail,
  IconMessageCircle,
  IconTarget,
  IconTrendingUp,
  IconFilter,
  IconSearch,
  IconDownload,
  IconUpload,
  IconRefresh,
  IconEdit,
  IconEye,
  IconStar,
  IconTag,
  IconMapPin,
  IconBuilding,
  IconCurrencyRupee,
  IconNote,
  IconClipboard,
  IconPlug,
} from "@tabler/icons-react";
import type { IconProps } from "@tabler/icons-react";

export type Icon = React.ComponentType<IconProps>;

export const Icons = {
  // Layout
  dashboard: IconLayoutDashboard,
  logo: IconCommand,
  kanban: IconLayoutKanban,
  plug: IconPlug,

  // Navigation
  login: IconLogin,
  close: IconX,
  chevronLeft: IconChevronLeft,
  chevronRight: IconChevronRight,
  arrowRight: IconArrowRight,

  // Actions
  add: IconPlus,
  trash: IconTrash,
  edit: IconEdit,
  view: IconEye,
  search: IconSearch,
  filter: IconFilter,
  download: IconDownload,
  upload: IconUpload,
  refresh: IconRefresh,
  check: IconCheck,

  // CRM Core
  users: IconUsers,
  usersGroup: IconUsersGroup,
  user: IconUser,
  user2: IconUserCircle,
  userPen: IconUserEdit,
  employee: IconUserX,

  // Communication
  phone: IconPhone,
  phoneCall: IconPhoneCall,
  mail: IconMail,
  message: IconMessageCircle,
  megaphone: IconSpeakerphone,

  // Business
  briefcase: IconBriefcase,
  building: IconBuilding,
  billing: IconCreditCard,
  currency: IconCurrencyRupee,
  target: IconTarget,
  trending: IconTrendingUp,

  // Tasks & Notes
  checkSquare: IconCheckbox,
  checklist: IconChecklist,
  note: IconNote,
  clipboard: IconClipboard,

  // Content
  product: IconShoppingBag,
  post: IconFileText,
  page: IconFile,
  fileText: IconFileText,
  media: IconPhoto,

  // Education (EasyLearning specific)
  graduationCap: IconSchool,

  // Analytics
  barChart: IconChartBar,
  circleDot: IconCircleDot,

  // Time & Calendar
  clock: IconClock,
  calendar: IconCalendar,

  // Misc
  settings: IconSettings,
  ellipsis: IconDotsVertical,
  warning: IconAlertTriangle,
  help: IconHelpCircle,
  pizza: IconPizza,
  star: IconStar,
  tag: IconTag,
  location: IconMapPin,

  // Theme
  sun: IconSun,
  moon: IconMoon,
  laptop: IconDeviceLaptop,

  // Social
  github: IconBrandGithub,
  twitter: IconBrandTwitter,

  // Loading
  spinner: IconLoader2,
};
