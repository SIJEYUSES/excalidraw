export type ImageJobStatus = "queued" | "running" | "completed" | "failed";

export interface ImageJobRequest {
  fileId: string;
  prompt?: string;
  options?: Record<string, unknown>;
}

export interface ImageJobResponse {
  jobId: string;
  status: ImageJobStatus;
  outputFileId?: string;
  message?: string;
}

export interface GenerationRequest {
  prompt: string;
  negativePrompt?: string;
  options?: Record<string, unknown>;
}

export interface GenerationResponse {
  jobId: string;
  status: ImageJobStatus;
  outputUrls?: string[];
  message?: string;
}

const mockJob = <T>(payload: T, delay = 600): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(payload), delay);
  });

export const removeBg = async (
  request: ImageJobRequest,
): Promise<ImageJobResponse> =>
  mockJob({
    jobId: `remove-bg-${request.fileId}`,
    status: "completed",
    outputFileId: `${request.fileId}-removed-bg`,
    message: "Mock remove background complete.",
  });

export const erase = async (
  request: ImageJobRequest,
): Promise<ImageJobResponse> =>
  mockJob({
    jobId: `erase-${request.fileId}`,
    status: "completed",
    outputFileId: `${request.fileId}-erased`,
    message: "Mock erase complete.",
  });

export const outpaint = async (
  request: ImageJobRequest,
): Promise<ImageJobResponse> =>
  mockJob({
    jobId: `outpaint-${request.fileId}`,
    status: "completed",
    outputFileId: `${request.fileId}-outpaint`,
    message: "Mock outpaint complete.",
  });

export const crop = async (
  request: ImageJobRequest,
): Promise<ImageJobResponse> =>
  mockJob({
    jobId: `crop-${request.fileId}`,
    status: "completed",
    outputFileId: `${request.fileId}-crop`,
    message: "Mock crop complete.",
  });

export const upscale = async (
  request: ImageJobRequest,
): Promise<ImageJobResponse> =>
  mockJob({
    jobId: `upscale-${request.fileId}`,
    status: "completed",
    outputFileId: `${request.fileId}-upscale`,
    message: "Mock upscale complete.",
  });

export const imageGen = async (
  request: GenerationRequest,
): Promise<GenerationResponse> =>
  mockJob({
    jobId: `image-gen-${request.prompt.replace(/\s+/g, "-")}`,
    status: "completed",
    outputUrls: ["https://example.com/mock-image.png"],
    message: "Mock image generation complete.",
  });

export const videoGen = async (
  request: GenerationRequest,
): Promise<GenerationResponse> =>
  mockJob({
    jobId: `video-gen-${request.prompt.replace(/\s+/g, "-")}`,
    status: "completed",
    outputUrls: ["https://example.com/mock-video.mp4"],
    message: "Mock video generation complete.",
  });
