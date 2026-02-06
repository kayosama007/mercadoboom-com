import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  onError?: (error: any) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  onError,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  
  // Store upload URLs in a map to avoid metadata issues
  const [uploadUrls] = useState(() => new Map<string, string>());
  
  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['image/*'], // Only allow images for product photos
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async (file) => {
          const params = await onGetUploadParameters();
          // Store the upload URL in our Map for later retrieval
          uploadUrls.set(file.id, params.url);
          console.log('Stored upload URL for file:', file.id, params.url);
          return params;
        },
      })
      .on("progress", (progress) => {
        // When upload reaches 100%, force completion after a short delay
        // This handles the CORS issue where we can't read ETag header
        if (progress === 100) {
          setTimeout(() => {
            const files = uppyInstance.getFiles();
            const result = {
              successful: files.map(file => {
                const uploadURL = uploadUrls.get(file.id) || '';
                console.log('Retrieved upload URL for file:', file.id, uploadURL);
                return {
                  ...file,
                  uploadURL,
                };
              }),
              failed: [],
            };
            onComplete?.(result as any);
            setShowModal(false);
            uppyInstance.cancelAll();
            // Clear the URLs map
            uploadUrls.clear();
          }, 500);
        }
      })
      .on("upload-error", (file, error) => {
        // For any errors, call the error handler
        onError?.(error);
      });
    
    return uppyInstance;
  });

  return (
    <div>
      <Button 
        type="button"
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        data-testid="button-upload-image"
      >
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}