export interface ProjectInviteType {
  project: {
    id: number;
    name: string;
  };
}

export interface PostSharedType {
  post: {
    title: string;
  };
  likes: number;
  shares: number;
}

export interface PhotoType {
  id: number;
  photo_url: string;
  caption: string;
}

export interface PhotosUploadType {
  photos: PhotoType[];
  group: string;
  count: number;
}

export interface Feed {
  type: 'PROJECT_INVITATION' | 'PHOTOS_UPLOADED' | 'SHARED_POST';
  id: number;
  user: {
    id: number;
    name: string;
    profile_pic: string;
  };
  metaData: any;
  timeRange: string;
  createdAt: string;
}
