import { Component } from '@angular/core';

type GalleryTag = 'Campus' | 'Students' | 'Faculty' | 'Events';

interface GalleryImage {
  src: string;
  title: string;
  tag: GalleryTag;
}

@Component({
  selector: 'app-gallery',
  imports: [],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})
export class Gallery {
  // Keyword-matched sample photos via LoremFlickr — each pulls a real photo tagged
  // with the keyword, `lock` pins a stable image. Keywords are deliberately
  // object/place oriented (books, building, laptop, research, conference…) to keep
  // results on-topic AND appropriate — people-heavy tags (concert/music/exam/…)
  // returned unsuitable photos, so they're avoided. Swap for real campus photos later.
  images: GalleryImage[] = [
    { src: this.flickr('school', 11, 800, 600), title: 'Main Campus Grounds', tag: 'Campus' },
    { src: this.flickr('desk', 12, 800, 980), title: 'Study Group, North Wing', tag: 'Students' },
    { src: this.flickr('research', 13, 800, 640), title: 'Faculty Research Lab', tag: 'Faculty' },
    { src: this.flickr('technology', 14, 800, 720), title: 'Tech Symposium', tag: 'Events' },
    { src: this.flickr('books', 15, 800, 1000), title: 'The Central Library', tag: 'Campus' },
    { src: this.flickr('laptop', 16, 800, 560), title: 'Computer Lab Session', tag: 'Students' },
    { src: this.flickr('research', 17, 800, 620), title: 'Department of Sciences', tag: 'Faculty' },
    { src: this.flickr('technology', 18, 800, 900), title: 'Innovation Expo', tag: 'Events' },
    { src: this.flickr('sports', 19, 800, 700), title: 'Inter-College Sports Meet', tag: 'Students' },
    { src: this.flickr('building', 20, 800, 520), title: "Founders' Hall", tag: 'Campus' },
    { src: this.flickr('laptop', 21, 800, 660), title: 'Digital Learning Hub', tag: 'Faculty' },
    { src: this.flickr('city', 22, 800, 560), title: 'City Campus View', tag: 'Campus' },
    { src: this.flickr('books', 23, 800, 600), title: 'Exam Preparation', tag: 'Students' },
    { src: this.flickr('building', 24, 800, 760), title: 'Annual Convocation', tag: 'Events' },
  ];

  private flickr(keyword: string, lock: number, w: number, h: number): string {
    return `https://loremflickr.com/${w}/${h}/${keyword}?lock=${lock}`;
  }

  // If a keyword returns nothing (or the service hiccups), fall back to a stable
  // curated photo so the masonry never shows a broken-image icon. Guarded with a
  // data flag so a failed fallback can't loop.
  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if (img.dataset['fallback']) return;
    img.dataset['fallback'] = '1';
    img.src = `https://picsum.photos/seed/${encodeURIComponent(img.alt)}/800/600`;
  }
}
