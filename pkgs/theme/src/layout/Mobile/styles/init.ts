export default (props: {
  insets: { bottom: number; top: number; left: number; right: number }
}) => {
  return css`
    * {
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      -webkit-user-select: none !important;
      user-select: none !important;
      touch-action: manipulation;
    }

    .btn-mobile:hover,
    .btn-mobile:focus {
      animation: phoneButtonEffect 0.2s linear;
    }
    @keyframes phoneButtonEffect {
      50% {
        opacity: 0.2;
      }
      100% {
        opacity: 1;
      }
    }

    @media only screen and (min-width: 768px) {
      &.mobile-layout {
        margin: 0px auto;
        max-width: 500px;
        min-width: 500px;
        border-left: 1px solid #ccc;
        border-right: 1px solid #ccc;
        background: white;
      }
    }

    &.mobile-layout {
      .safe-area-top {
        width: 100%;
        flex-grow: 0;
        flex-shrink: 0;
        flex-basis: ${props.insets.top}px;
      }

      .safe-area-bottom {
        height: ${props.insets.bottom}px;
      }
    }
  `
}
