import {Pipe, PipeTransform} from "@angular/core";

export function hasContents(value: string): boolean {
    return value ? !!value.match(/[^\s\t ]/) : false;
}

@Pipe({name: 'hasContents'})
export class HasContentsPipe implements PipeTransform {
    transform(value: string): boolean {
        return hasContents(value);
    }
}

@Pipe({name: 'emptyContents'})
export class EmptyContentsPipe implements PipeTransform {
    transform(value: string): boolean {
        return !hasContents(value);
    }
}


