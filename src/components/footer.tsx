import { Github, Heart, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Informações sobre o projeto */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Agenda Tech Brasil 🇧🇷</h3>
            <p className="text-muted-foreground text-sm">
              Descubra os melhores eventos de tecnologia organizados por mês.
              Encontre workshops, palestras e conferências que vão impulsionar
              sua carreira.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">Links Úteis</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  href="https://github.com/agenda-tech-brasil/agenda-tech-brasil"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Repositório dos Dados
                </a>
              </li>
              <li>
                <a
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  href="https://github.com/GusMartins499/tech-calendar-brazil"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Código Fonte
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">Contato</h4>
            <div className="flex items-center space-x-2 text-muted-foreground text-sm">
              <Mail className="size-4" />
              <span>gustavosm994@gmail.com</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground text-sm">
              <Github className="size-4" />
              <a
                className="transition-colors hover:text-foreground"
                href="https://github.com/GusMartins499"
                rel="noopener noreferrer"
                target="_blank"
              >
                @GusMartins499
              </a>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground text-sm">
              <Linkedin className="size-4" />
              <a
                className="transition-colors hover:text-foreground"
                href="https://www.linkedin.com/in/gustavo-martins994/"
                rel="noopener noreferrer"
                target="_blank"
              >
                Gustavo Martins
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-6">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-muted-foreground text-sm">
              © {currentYear} Agenda Tech Brasil. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-1 text-muted-foreground text-sm">
              <span>Feito com</span>
              <Heart className="size-4 text-red-500" />
              <span>para a comunidade tech brasileira</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
