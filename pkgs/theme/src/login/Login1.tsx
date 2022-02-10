/** @jsx jsx */
export const Login1 = ({ children }: any) => {
  return (
    <div className="flex flex-row flex-1 w-full h-full">
      <div className="hidden w-2/5 bg-blue-200 lg:flex items-center justify-center">
        <img src="https://preview.keenthemes.com/metronic/theme/html/demo2/dist/assets/media/logos/logo-letter-1.png" />
      </div>
      <div className="flex-1 flex flex-row items-center justify-center">
        {children}
        {/* <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Welcome To Metronic</h1>
          <h1 className="text-2xl text-gray-500">New Here ?</h1>
        </div> */}
      </div>
    </div>
  )
}
