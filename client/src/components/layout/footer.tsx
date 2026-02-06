import logoPath from "@assets/LOGO_1754893994411.gif";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 md:py-12 mt-8 md:mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="bg-white p-2 rounded-lg inline-block mb-4">
              <img
                src={logoPath}
                alt="MercadoBoom Logo"
                className="h-8 sm:h-10 md:h-12 w-auto"
              />
            </div>
            <p className="text-gray-400 text-sm sm:text-base">
              La tienda en línea más rápida de México. Compra electrónicos al
              mayoreo con la confianza de MercadoBoom.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Productos</h3>
            <ul className="space-y-1 sm:space-y-2 text-gray-400 text-sm sm:text-base">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  📱 Smartphones
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  💻 Laptops
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  🎧 Audio
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  📷 Cámaras
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Ayuda</h3>
            <ul className="space-y-1 sm:space-y-2 text-gray-400 text-sm sm:text-base">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Centro de Ayuda
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Seguimiento
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Devoluciones
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Contacto</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                +52 55 1256 2704
              </li>
              <li className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                ventas@mercadoboom.com
              </li>
              <li className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                CDMX, México
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 MercadoBoom. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
