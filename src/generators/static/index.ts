import { SiteConfig } from '../../types';
import { FileSystemManager } from '../../core/FileSystemManager';
import { TemplateEngine } from '../../templates/TemplateEngine';
import { ImpressumPage } from './ImpressumPage';
import { SearchPage } from './SearchPage';

export function createStaticPageGenerators(
  config: SiteConfig,
  fs: FileSystemManager,
  template: TemplateEngine
) {
  return [
    new ImpressumPage(config, fs, template),
    new SearchPage(config, fs, template)
  ];
}

