/**
 * Interface for EventLog to describe events.
 *
 * @interface
 */
export interface Event {
    objects?: Object[]
    message: string
    time: number
    state: Object
}

/**
 * Property for any attribute of a class with key and value pair.
 */
interface Property {
    key: string
    value: any
}

/**
 * Interface for Objects for logging purposes. Can have Property[] or Propertu[][]
 */
interface Object {
    name: string
    properties: Property[] | Property[][]
}

/**
 * Logging class for debugging purposes. Mainly to be used with different Relationships.
 */
export default class EventLog {
    primary: any
    log = new Set<Event>()

    constructor(obj: any) {
        this.primary = obj
    }

    /**
     * Prints an Event in a console group.
     * @param event
     */
    print(event: Event) {
        console.groupCollapsed(event.message)
        this.printObjects(event.objects)
        this.printObject(event.state)
        console.log(event.time)
        console.groupEnd()
    }

    /**
     * Used to print multiple objects inside a collapsed group.
     * @param objs Object Array
     */
    printObjects(objs?: Object[]) {
        if(!objs) return

        console.groupCollapsed(`Objects: ${objs.length}`)

        for (const obj of objs) {
            this.printObject(obj)
        }

        console.groupEnd()
    }

    /**
     * Used to print properties, usually from printObject()
     * @param properties
     */
    printProperties(properties: Property[]) {
        for (const prop of properties) {
            console.log(`${prop.key}:`, prop.value)
        }
    }

    /**
     * Used to print a given Object but has special cases for Sets for shapeOrbits (OrbitRelationship)
     * @param obj
     */
    printObject(obj: Object) {
        console.groupCollapsed(obj.name)

        //if 2D array
        if(Array.isArray(obj.properties[0])) {
            for(const prop of obj.properties) {
                // @ts-ignore, will always be Property[]
                this.printProperties(prop)
            }
        }
        else {
            //@ts-ignore
            this.printProperties(obj.properties)
        }

        console.groupEnd()
    }

    /**
     * Prints all events in the current instance with special formatting.
     */
    printAll() {
        console.group(this.primary.name)
        console.log(this.primary)
        for (const e of this.log) {
            this.print(e)
        }

        console.groupEnd()
    }

    /**
     * Goes through every object entry and constructs a Property array.
     * @param obj
     */
    getProperties(obj: any) {
        let properties: Property[] = []

        for (const [key, value] of Object.entries(obj) as [string, any]) {
            const prop: Property = {key: key, value: value}
            properties.push(prop)
        }

        return properties;
    }

    /**
     * Gets objects from a set and gets the properties of each one.
     * @param set
     */
    getSetProperties(set: Set<any>) {
        let properties: Property[][] = []

        for (const obj of set) {
            properties.push(this.getProperties(obj))
        }

        return properties
    }

    /**
     * Checks if a given object is a Set. May not be needed?
     * @param obj
     */
    isSet(obj: any): obj is Set<any> {
        return obj instanceof Set
    }

    /**
     * For a given array of various Object objects, it will get the appropriate properties
     * and uses the proper methods for Sets
     * @param objects
     */
    getObjectsProperties(objects?: any[]) {
        if (!objects) return undefined
        let objs: Object[] = []

        for (const o of objects) {
            if(this.isSet(o)) {
                const obj: Object = {name: "Set", properties: this.getSetProperties(o)}
                objs.push(obj)
            }
            else {
                const obj: Object = {name: o.name, properties: this.getProperties(o)}
                objs.push(obj)
            }
        }

        return objs
    }

    /**
     * Method for creating Objects using the interface.
     * @param obj
     * @param name
     */
    createObject(obj: any, name?: string): Object {
        let n: string

        if(name) n = name
        else if(obj.name) n = obj.name
        else n = "Object"

        return {name: n, properties: this.getProperties(obj)}
    }

    /**
     * Returns an Event and can be automatically added to the log.
     * @param message String to use to describe Event.
     * @param objects Optional, objects to be included in this Event to see their saved properties later.
     * @param add Option to add the created Event to the log, on by default.
     */
    create(message: string, objects?: any | any[], add = true): Event {
        if(objects && !Array.isArray(objects))
            objects = [objects]

        const event: Event = {
            objects: this.getObjectsProperties(objects),
            message: message,
            time: performance.now(),
            state: this.createObject(this.primary)
        }

        if (add) this.add(event)

        return event
    }

    /**
     * Adds Event to the log.
     * @param event
     */
    add(event: Event) {
        this.log.add(event)
    }
}