import { Icon } from "@iconify/react";
import type { Model } from "../lib/models";

type BrandIconProps = {
  model?: Pick<Model, "slug" | "vendor" | "iconifyId">;
  icon?: string;
  className?: string;
  "aria-hidden"?: boolean;
};

export function BrandIcon({
  model,
  icon,
  className = "w-8 h-8",
  ...rest
}: BrandIconProps) {
  if (
    model &&
    (model.slug.startsWith("lfm2") || model.vendor === "Liquid AI")
  ) {
    return <LiquidAiMark className={className} {...rest} />;
  }
  if (model && model.vendor === "Zhipu AI") {
    return <ZhipuAiMark className={className} {...rest} />;
  }

  return (
    <Icon
      icon={icon ?? model?.iconifyId ?? "simple-icons:openai"}
      className={className}
      {...rest}
    />
  );
}

function LiquidAiMark({
  className = "w-8 h-8",
  ...rest
}: {
  className?: string;
  "aria-hidden"?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...rest}
    >
      <path d="m12.4 8.546-.009.005 3.142 5.25a3.84 3.84 0 0 1 .066 4.224L22 16.034 11.986 0 9.575 3.872zM7.017 24l5.029-4.053h-.013c-2.302 0-4.167-1.784-4.167-3.984 0-.795.245-1.534.664-2.156l2.972-4.976-2.47-4.087L2 16.034 7.008 24zM14.172 19.382h-.001L8.452 24h8.486l4.3-6.768z"></path>
    </svg>
  );
}

function ZhipuAiMark({
  className = "w-8 h-8",
  ...rest
}: {
  className?: string;
  "aria-hidden"?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 30"
      fill="currentColor"
      fillRule="evenodd"
      {...rest}
    >
      <path d="M24.51 28.51H5.49c-2.21 0-4-1.79-4-4V5.49c0-2.21 1.79-4 4-4h19.03c2.21 0 4 1.79 4 4v19.03c0 2.21-1.79 4-4 4z M15.47 7.1l-1.3 1.85c-.2.29-.54.47-.9.47H6.17V7.1h9.3z M24.3 7.1L13.14 22.91H5.7L16.86 7.1z M14.53 22.91l1.31-1.86c.2-.29.54-.47.9-.47h7.09v2.33h-9.3z" />
    </svg>
  );
}

export function AgenticModeLogo({
  className,
  ...rest
}: {
  className?: string;
  "aria-hidden"?: boolean;
}) {
  return (
    <svg
      className={className}
      {...rest}
      width="342"
      height="42"
      viewBox="0 0 342 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 6H24V12H0V6ZM18 12H24V18H18V12ZM30 6H54V12H30V6ZM30 12H36V18H30V12ZM48 12H54V18H48V12ZM60 6H84V12H60V6ZM60 12H66V18H60V12ZM78 12H84V18H78V12ZM90 6H114V12H90V6ZM90 12H96V18H90V12ZM108 12H114V18H108V12ZM120 6H144V12H120V6ZM126 0H132V6H126V0ZM126 12H132V18H126V12ZM150 0H156V6H150V0ZM150 12H156V18H150V12ZM162 6H186V12H162V6ZM162 12H168V18H162V12ZM199 6H229V12H199V6ZM199 12H205V18H199V12ZM211 12H217V18H211V12ZM223 12H229V18H223V12ZM235 6H259V12H235V6ZM235 12H241V18H235V12ZM253 12H259V18H253V12ZM265 6H289V12H265V6ZM265 12H271V18H265V12ZM283 0H289V6H283V0ZM283 12H289V18H283V12ZM295 6H319V12H295V6ZM295 12H301V18H295V12ZM313 12H319V18H313V12Z"
        fill="currentColor"
        fillOpacity="0.92"
      />
      <path
        d="M0 18H24V24H0V18ZM0 24H6V30H0V24ZM0 30H24V36H0V30ZM18 24H24V30H18V24ZM30 18H54V24H30V18ZM30 30H54V36H30V30ZM48 24H54V30H48V24ZM60 18H84V24H60V18ZM60 24H66V30H60V24ZM60 30H84V36H60V30ZM90 18H96V36H90V18ZM108 18H114V36H108V18ZM126 18H132V30H126V18ZM126 30H138V36H126V30ZM150 18H156V36H150V18ZM162 18H168V30H162V18ZM162 30H186V36H162V30ZM199 18H205V36H199V18ZM211 18H217V24H211V18ZM223 18H229V36H223V18ZM235 18H241V30H235V18ZM235 30H259V36H235V30ZM253 18H259V30H253V18ZM265 18H271V30H265V18ZM265 30H289V36H265V30ZM283 18H289V30H283V18ZM295 18H319V24H295V18ZM295 24H301V30H295V24ZM295 30H319V36H295V30Z"
        fill="currentColor"
        fillOpacity="0.5"
      />
    </svg>
  );
}
