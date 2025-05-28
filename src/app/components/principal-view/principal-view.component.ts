import {
  Component,
  ViewChild,
  ElementRef,
  NgZone,
  inject,
} from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { WorkflowService } from '../../services/workflow.service';

@Component({
  selector: 'app-principal-view',
  standalone: false,
  templateUrl: './principal-view.component.html',
  styleUrl: './principal-view.component.css',
})
export class PrincipalViewComponent {
  temperature = 1;
  maxLength = 500;
  model = 'gpt-3.5-turbo';
  inputText = '';
  quests: any = []; // Array de objetos
  conversations: any[] = [];
  waiting = false;
  record: boolean = false;
  recognition: any;
  frontMessages: any[] = []; // Variable para almacenar los mensajes que se muestran en el front
  messages: any[] = []; // Variable para almacenar los mensajes que se envían al servidor
  code = `function myFunction() {
    document.getElementById("demo1").innerHTML = "Test 1!";
    document.getElementById("demo2").innerHTML = "Test 2!";
  }`;

  bypassCondition = true;

  private workflowService = inject(WorkflowService);

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private clipboard: Clipboard
  ) {
    (this.sanitizer as any)._getSanitizationBypassAndMode = () => ({
      bypass: true,
      mode: SecurityContext.NONE,
    });
  }

  highlightCode(text: string): string {
    const bloquesCodigo: string[] = [];

    const bloques = text.split('```');
    for (let i = 1; i < bloques.length; i += 2) {
      const bloque = bloques[i];
      const lines = bloque.split('\n');

      const lenguaje = lines[0].trim();
      const codigo = lines.slice(1).join('\n');

      // Generar el fragmento HTML para el bloque de código
      const codigoHTML = `<pre><code [highlight]="${this.escapeString(
        codigo
      )}" [languages]="['${lenguaje}']" [lineNumbers]="true"></code></pre>`;
      bloquesCodigo.push(codigoHTML);
    }

    // Unir los fragmentos HTML y el texto restante
    let resultadoFinal = '';
    for (let i = 0; i < bloques.length; i += 2) {
      resultadoFinal += bloques[i];
      if (i < bloques.length - 1) {
        resultadoFinal += bloquesCodigo[i / 2];
      }
    }

    return resultadoFinal;
  }

  // Función para escapar caracteres especiales en una cadena
  escapeString(text: string): string {
    return text.replace(/"/g, '\\"');
  }

  sanitizeHtml(html: string): SafeHtml {
    return html as SafeHtml;
  }

  /*---------------------------------------------------------------------------------------*/
  // EN DESARROLLO
  // Función para enviar el prompt con contexto de messages e ir mostrando chunk a chunk de la respuesta

  sendQuest() {
    this.messages.push({ role: 'user', content: this.inputText });
    this.waiting = true;
    const textArea = document.getElementById(
      'textInput'
    ) as HTMLTextAreaElement;
    textArea.style.height = '20px'; // Ajustar la altura en función del contenido
    this.inputText = '';

    const header: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    const lastUserMessage = this.messages[this.messages.length - 1].content;
    console.log('Último mensaje del usuario:', lastUserMessage);
    this.workflowService.sendRequest(lastUserMessage).subscribe({
      next: (response: any) => {
        console.log('Respuesta del servidor:', response);
        response = response[0].output;

        console.log('Respuesta del servidor:', response);
        this.waiting = false;

        // Formatear la respuesta y agregarla a los mensajes
        let formattedText = this.formatText(response);
        const highlightedCode = this.highlightCode(formattedText);
        const sanitizedHtml = this.sanitizeHtml(highlightedCode);

        this.messages.push({ role: 'system', content: sanitizedHtml });
        console.log(this.messages);
      },
      error: (error: any) => {
        console.error('Error en la solicitud:', error);
        // this.waiting = false;
      },
    });
  }

  /*---------------------------------------------------------------------------------------*/
  // Función para formatear el texto
  formatText(text: string) {
    // Reemplaza las triple comillas por sus entidades HTML correspondientes
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  /*---------------------------------------------------------------------------------------*/
  // Función para ajustar la altura del textarea según el texto ingresado
  autoAdjustTextArea(event: any) {
    const textArea = event.target;
    if (textArea.scrollHeight > textArea.clientHeight) {
      textArea.style.height = 'auto'; // Restablecer la altura para calcular la altura deseada
      textArea.style.height = textArea.scrollHeight + 'px'; // Ajustar la altura en función del contenido
    }
    if (textArea.scrollHeight < 42) {
      textArea.style.height = '20px'; // Ajustar la altura en función del contenido
    }
  }
  /*---------------------------------------------------------------------------------------*/
  // Función para enviar el mensaje cuando se presiona la tecla Enter

  onKeyDown(event: KeyboardEvent): void {
    const textArea = event.target as HTMLTextAreaElement;
    textArea.style.height = '20px';

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Evita el salto de línea en el textarea
      this.sendQuest(); // Llama a tu función para enviar el mensaje
    }
  }

  /*---------------------------------------------------------------------------------------*/
  // Función para reproducir el audio del texto que se quiere escuchar

  repVoice(text: string) {
    console.log(text);

    this.workflowService.textToSpeech(text).subscribe({
      next: (response: Blob) => {
        console.log('Respuesta del servidor:', response);
        const audioBlob = new Blob([response], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      },
      error: (error) => {
        console.error('Error en la solicitud:', error);
      },
    });

    // this.http
    //   .post(
    //     'http://localhost:5500/speech',
    //     { text: textoLegible },
    //     { responseType: 'blob' }
    //   )
    //   .subscribe((data: Blob) => {
    //     const audioBlob = new Blob([data], { type: 'audio/mpeg' });
    //     const audioUrl = URL.createObjectURL(audioBlob);

    //     const audio = new Audio(audioUrl);
    //     audio.play();
    //   });
  }

  /*---------------------------------------------------------------------------------------*/
  // Función para copiar el texto al portapapeles

  copyText(text: SafeHtml) {
    console.log(text);
    const textoPlano = this.sanitizer.sanitize(SecurityContext.HTML, text);
    console.log(textoPlano);
    console.log(this.messages);
    const textoLegible: any = textoPlano?.replace(/&nbsp;/g, ' ');
    if (this.clipboard.copy(textoLegible)) {
      console.log('Texto copiado al portapapeles: ', textoLegible);
    } else {
      console.error('Error al copiar el texto al portapapeles');
    }
  }

  /*---------------------------------------------------------------------------------------*/
  // EN DESARROLLO
  // Función para grabar audio

  recMic() {
    const chunks: any = [];
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);

      console.log(mediaRecorder.state);
      console.log(mediaRecorder);
      console.log('recorder started');

      mediaRecorder.ondataavailable = function (e) {
        console.log('data available');
        console.log(e.data);
        chunks.push(e.data);
      };

      mediaRecorder.onstop = function () {
        console.log('recording stopped');
        // Aquí puedes procesar los datos almacenados en 'chunks'
        const blob = new Blob(chunks, { type: 'audio/wav' });
        // blob es el archivo de audio que puedes enviar a tu API o manipular
      };

      mediaRecorder.start();

      // Suponiendo que deseas que la grabación dure un tiempo determinado
      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000); // Detiene la grabación después de 5 segundos (5000 ms)
    });
  }

  stopRecord() {
    this.record = false;
  }
}
