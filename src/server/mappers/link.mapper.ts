import {LinkDto} from '../dto/link.dto';
import {Link} from '../entities/link';

export default function toLinkDto(link: Link): LinkDto {
  return {
    rel: link.rel,
    href: link.href
  } as LinkDto;
}
