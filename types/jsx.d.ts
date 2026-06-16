import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'otnet-video-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        ref?: React.Ref<HTMLElement & { setup: (cfg: unknown) => void }>;
        'content-ids'?: string;
        'channel-ids'?: string;
        'viewer-token'?: string;
        'profile-index'?: string | number;
        autoplay?: boolean | '';
        muted?: boolean | '';
      };
      'otnet-paywall-handler': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'content-id'?: string;
        'login-href'?: string;
        'checkout-endpoint'?: string;
        'mint-endpoint'?: string;
      };
      'otnet-rental-countdown': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'expires-at'?: string;
        label?: string;
        compact?: boolean;
      };
    }
  }
}

export {};
