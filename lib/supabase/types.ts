export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "admin" | "reader";
  created_at: string;
};

export type Cafe = {
  id: string;
  name: string;
  slug: string;
  address: string;
  lat: number;
  lng: number;
  neighborhood: string;
  vibe_tags: string[];
  overall_rating: number | null;
  cover_photo_url: string | null;
  google_place_id: string | null;
  status: "published" | "draft";
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  cafe_id: string;
  author_id: string | null;
  date_visited: string;
  note: string;
  overall_rating: number;
  status: "published" | "draft";
  created_at: string;
  updated_at: string;
};

export type Item = {
  id: string;
  cafe_id: string;
  review_id: string | null;
  name: string;
  category: "drink" | "food";
  type: string;
  rating: number;
  photo_url: string | null;
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
};

export type Photo = {
  id: string;
  cafe_id: string;
  review_id: string | null;
  photo_url: string;
  caption: string | null;
  created_at: string;
};

export type WantToGo = {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  source: "google_maps" | "manual";
  notes: string | null;
  cafe_id: string | null;
  created_at: string;
};

// Joined types for common queries
export type ReviewAuthor = Pick<Profile, "display_name">;

export type CafeWithReviews = Cafe & {
  reviews: (Review & { author: ReviewAuthor | null })[];
  items: Item[];
  photos: Photo[];
};

export type ReviewWithDetails = Review & {
  cafe: Cafe;
  author: ReviewAuthor | null;
  items: Item[];
  photos: Photo[];
};

// Database schema type for Supabase client
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Pick<Profile, "id"> & Partial<Omit<Profile, "id" | "created_at">>;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      cafes: {
        Row: Cafe;
        Insert: Omit<Cafe, "id" | "created_at" | "updated_at" | "overall_rating" | "cover_photo_url" | "google_place_id"> & {
          overall_rating?: number | null;
          cover_photo_url?: string | null;
          google_place_id?: string | null;
        };
        Update: Partial<Omit<Cafe, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, "id" | "created_at" | "updated_at" | "author_id"> & {
          author_id?: string | null;
        };
        Update: Partial<Omit<Review, "id" | "created_at" | "updated_at">>;
        Relationships: [
          {
            foreignKeyName: "reviews_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      items: {
        Row: Item;
        Insert: Omit<Item, "id" | "created_at">;
        Update: Partial<Omit<Item, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "items_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "items_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          }
        ];
      };
      photos: {
        Row: Photo;
        Insert: Omit<Photo, "id" | "created_at" | "caption"> & {
          caption?: string | null;
        };
        Update: Partial<Omit<Photo, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "photos_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "photos_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          }
        ];
      };
      want_to_go: {
        Row: WantToGo;
        Insert: Omit<WantToGo, "id" | "created_at">;
        Update: Partial<Omit<WantToGo, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "want_to_go_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
  };
};
