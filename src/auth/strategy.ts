/** ESTA ESTRATEGIA ES UN INTERCEPTOR ENTRE EL CLIENTE Y EL CONTROLADOR */

import {
  AuthenticationBindings,
  AuthenticationMetadata,
  AuthenticationStrategy,
} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {HttpErrors, Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import parseBearerToken from 'parse-bearer-token';
import {ConfiguracionSeguridad} from '../config/configuracion.seguridad';
const fetch = require('node-fetch');

export class AuthStrategy implements AuthenticationStrategy {
  name: string = 'auth';

  constructor(
    @inject(AuthenticationBindings.METADATA)
    private metadata: AuthenticationMetadata[],
  ) {}

  /**
   * Autenticación de un usuario frente a una acción en la base de datos
   * @param request la solicitud con el token
   * @returns el perfil de usuario, undefined si no tiene permisos o HttpErrors[401]
   */
  async authenticate(request: Request): Promise<UserProfile | undefined> {
    let token = parseBearerToken(request);
    if (token) {
      let idMenu = this.metadata[0].options![0];
      let accion = this.metadata[0].options![1];
      console.log('Metadata', this.metadata);

      // Conectar con ms de seguridad
      const datos = {
        token: token,
        idMenu: idMenu,
        accion: accion,
      };

      const urlValidarPermisos = `${ConfiguracionSeguridad.enlaceMicroservicioSeguridad}/validar-permisos`;
      let res = undefined;
      try {
        await fetch(urlValidarPermisos, {
          method: 'post',
          body: JSON.stringify(datos),
          headers: {
            'Content-Type': 'application/json',
            //Authorization: `Bearer ${token}`,  <-- Tambien puedo enviar el token desde el header por si no queremos enviarlo desde la peticion
          },
        })
          .then((res: any) => res.json())
          .then((json: any) => {
            console.log('Respuesta: ');
            console.log(json);
            console.log('Conectado con ms de seguridad');
            res = json;
          });

        if (res) {
          let perfil: UserProfile = Object.assign({
            permitido: 'OK',
          });
          return perfil;
        } else {
          return undefined;
        }
      } catch (e) {
        throw new HttpErrors[401](
          'No se tienen permisos sobre la acción solicitada',
        );
      }
    }
    console.log('Ejecutando estrategia desded lógica de negocio');
    throw new HttpErrors[401](
      'No estas autenticado, No es posible realizar esta acción por falta de un token',
    );
  }
}
