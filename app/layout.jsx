import Script from 'next/script';
import assets from './assets.json';
export const metadata={title:'Redlyn · Visual website feedback for agencies',description:'Visual website feedback for agencies. One link for your team, one for your client.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}) {
 return <html lang="en"><head><link rel="stylesheet" href="/styles.css"/></head><body>
   {children}<div id="toast" role="status" aria-live="polite"/>
   <Script src={assets.app} type="module" strategy="afterInteractive"/>
 </body></html>;
}
