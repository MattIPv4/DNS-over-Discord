import { ComponentType } from 'discord-api-types/payloads';

export const updateComponents = (components, update) => components.map(component => {
    if (component.type === ComponentType.ActionRow)
        return { ...component, components: updateComponents(component.components, update) };
    return update(component);
});
