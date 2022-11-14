import { BaseController, RestrictedControllerMessenger } from '@metamask/base-controller';
/**
 * List of child controller instances
 *
 * This type encompasses controllers based up either BaseController or
 * BaseControllerV2. The BaseControllerV2 type can't be included directly
 * because the generic parameters it expects require knowing the exact state
 * shape, so instead we look for an object with the BaseControllerV2 properties
 * that we use in the ComposableController (name and state).
 */
export declare type ControllerList = (BaseController<any, any> | {
    name: string;
    state: Record<string, unknown>;
})[];
export declare type ComposableControllerRestrictedMessenger = RestrictedControllerMessenger<'ComposableController', never, any, never, any>;
/**
 * Controller that can be used to compose multiple controllers together.
 */
export declare class ComposableController extends BaseController<never, any> {
    private controllers;
    private messagingSystem?;
    /**
     * Name of this controller used during composition
     */
    name: string;
    /**
     * Creates a ComposableController instance.
     *
     * @param controllers - Map of names to controller instances.
     * @param messenger - The controller messaging system, used for communicating with BaseControllerV2 controllers.
     */
    constructor(controllers: ControllerList, messenger?: ComposableControllerRestrictedMessenger);
    /**
     * Flat state representation, one that isn't keyed
     * of controller name. Instead, all child controller state is merged
     * together into a single, flat object.
     *
     * @returns Merged state representation of all child controllers.
     */
    get flatState(): {};
}
export default ComposableController;
