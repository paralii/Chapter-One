import React, {useEffect} from "react";

const BookLoader = ({ fullPage = true, duration = 3800, onFinish  }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.(); 
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish]);
  return (
    <div
      id="preloader"
      className={`${
        fullPage ? "fixed top-0 left-0 w-full h-full" : "relative w-full h-[200px]"
      } flex justify-center items-center bg-[#fff8e5] z-50`}
    >
      <div className="real-book">
        <ul className="pages">
          {[...Array(19)].map((_, i) => (
            <li className="page" key={i}></li>
          ))}
        </ul>
      </div>

      <style>
        {`
          .real-book {
            --color: #654321;
            --duration: 3.8s;
            width: 32px;
            height: 12px;
            position: relative;
          }

          .real-book .pages .page {
            height: 4px;
            border-radius: 2px;
            width: 48px;
            position: absolute;
            background: var(--color);
            transform: translateX(-18px);
            animation: var(--duration) ease-in-out infinite;
          }

          ${[...Array(19)]
            .map((_, i) => `.real-book .pages .page:nth-child(${i}) { animation-name: page-${i}; }`)
            .join("\n")}

          ${[...Array(19)]
            .map(
              (_, i) => `@keyframes page-${i} {
                0%, 100% { transform: rotateZ(0deg) translateX(-18px) scaleY(1); }
                50% { transform: rotateZ(${i * 10}deg) translateX(-18px) scaleY(1); }
              }`
            )
            .join("\n")}
        `}
      </style>
    </div>
  );
};

export default BookLoader;
