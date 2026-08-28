/**
 * Mojo clean-architecture boundary rule.
 *
 * Enforces the architectural invariants that keep the modular monolith from
 * becoming a ball of mud, at the file/layer level (the `@nx/enforce-module-boundaries`
 * scope rule only guards which *module* may be imported):
 *
 *  1. Domains are fully isolated. A `domain/` file may only import shared libs
 *     (`@mojo/shared/*`) and its own module — never any other module, not even
 *     another module's `domain`. Cross-cutting concepts that several domains
 *     need (e.g. `TutorLevel`) live in `@mojo/shared/domain`, and inter-module
 *     contracts are declared locally by the consumer (dependency inversion)
 *     rather than imported from the producer.
 *
 *  2. Cross-module access is restricted to contracts and the event bus. Only
 *     `application` and `infrastructure` may import another module's `domain`
 *     (its types/ports), and only `application` may publish/subscribe via
 *     `@mojo/shared/events`. `@mojo/<other>/application`, `/infrastructure`,
 *     and `/feature` may NEVER cross a module boundary.
 *
 *  3. Layer dependency direction is inward:
 *       domain <- application <- feature
 *       domain <- infrastructure
 *     `application` must not import `infrastructure`/`feature` or Prisma;
 *     `infrastructure` may import `domain` but not `application`/`feature`;
 *     `feature` imports `application`/`domain` but not `infrastructure`.
 *
 *  4. Prisma is a persistence detail -> infrastructure only (non-shared libs).
 *
 * Apps (`apps/**`) are the composition root and are exempt.
 */

function norm(p) {
  return String(p).split('\\').join('/');
}

function moduleLayerOf(path) {
  const m = path.match(/\/src\/(domain|application|infrastructure|feature)\//);
  return m ? m[1] : null;
}

function inferModule(path) {
  const shared = path.match(/libs\/shared\/([a-z0-9-]+)\/src\//);
  if (shared) return `shared/${shared[1]}`;
  const mod = path.match(/libs\/([a-z0-9-]+)\/src\//);
  return mod ? mod[1] : 'unknown';
}

function parseTarget(importPath) {
  const mm = importPath.match(/^@mojo\/shared\/(domain|events|ui|util|use-mobile)$/);
  if (mm) return { area: 'shared', layer: mm[1] };
  const m = importPath.match(/^@mojo\/([a-z0-9-]+)\/(domain|application|infrastructure|feature)$/);
  if (m) return { area: m[1], layer: m[2] };
  if (importPath.startsWith('@mojo/'))
    return { area: importPath.slice('@mojo/'.length), layer: null };
  return null;
}

const rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Enforce Mojo clean-architecture boundaries' },
    messages: {
      domainNotIsolated:
        'Clean architecture: {{source}}/domain must not import another module ({{importPath}}). Domains depend only on @mojo/shared and their own module; declare a local contract or promote the type to shared/domain instead.',
      sharedImportsModule:
        'Clean architecture: a shared lib must not import a module ({{importPath}}); shared libs depend only on other shared libs.',
      crossModuleLayer:
        'Module boundary: only domain contracts may cross module boundaries, and only from application/infrastructure. {{importPath}} reaches into {{target}}/{{layer}}; depend on {{target}}/domain types or publish/subscribe via shared/events.',
      domainImpure:
        'Clean architecture: {{source}}/domain must be pure and must not import {{importPath}}.',
      applicationImportsInfra:
        'Clean architecture: {{source}}/application must not import {{importPath}}; depend on domain ports, not concrete infrastructure or feature.',
      prismaOutsideInfrastructure:
        'Clean architecture: Prisma ({{importPath}}) may only be imported by {{source}}/infrastructure.',
      infraImportsApplication:
        'Clean architecture: {{source}}/infrastructure implements domain ports and must not depend on {{importPath}} (application/feature).',
      featureImportsInfra:
        'Clean architecture: {{source}}/feature must not import {{importPath}} (infrastructure).',
      wholeModuleImport:
        'Module boundary: import a specific layer of {{importPath}} (e.g. /domain or /application), not the whole module.',
    },
  },
  create(context) {
    const path = norm(context.filename || context.getFilename());
    const sourceLayer = moduleLayerOf(path);
    const source = inferModule(path);
    const isApp = /\/apps\//.test(path);

    const report = (node, messageId, importPath) =>
      context.report({ node, messageId, data: { source, importPath } });

    const common = {
      ImportDeclaration(node) {
        const importPath = String(node.source.value);

        // Prisma is a persistence detail -> infrastructure only.
        if (importPath === '@prisma/client' || importPath.startsWith('@prisma/')) {
          if (!isApp && sourceLayer !== 'infrastructure' && !source.startsWith('shared/')) {
            report(node, 'prismaOutsideInfrastructure', importPath);
          }
          return;
        }

        if (!importPath.startsWith('@mojo/')) return;

        const target = parseTarget(importPath);
        if (!target) return;
        if (isApp) return; // composition root exempt

        const targetIsShared = target.area === 'shared';
        if (targetIsShared) {
          // shared/domain is the dependency-free leaf.
          if (source === 'shared/domain') report(node, 'domainImpure', importPath);
          return;
        }

        if (target.layer === null) {
          report(node, 'wholeModuleImport', importPath);
          return;
        }

        // Shared libs belong to no module; they must never reach into one.
        if (source.startsWith('shared/')) {
          report(node, 'sharedImportsModule', importPath);
          return;
        }

        const crossModule = target.area !== source;
        if (crossModule) {
          // Domains are fully isolated: only shared/local (never other modules).
          if (sourceLayer === 'domain') {
            report(node, 'domainNotIsolated', importPath);
            return;
          }
          // application/infrastructure may consume another module's domain contract,
          // but never its application/infrastructure/feature.
          if (target.layer !== 'domain') report(node, 'crossModuleLayer', importPath);
          return;
        }

        // layer direction within the same module
        switch (sourceLayer) {
          case 'domain':
            if (target.layer !== 'domain') report(node, 'domainImpure', importPath);
            break;
          case 'application':
            if (target.layer === 'infrastructure' || target.layer === 'feature')
              report(node, 'applicationImportsInfra', importPath);
            break;
          case 'infrastructure':
            if (target.layer === 'application' || target.layer === 'feature')
              report(node, 'infraImportsApplication', importPath);
            break;
          case 'feature':
            if (target.layer === 'infrastructure') report(node, 'featureImportsInfra', importPath);
            break;
          default:
            break;
        }
      },
    };
    return common;
  },
};

export default rule;
