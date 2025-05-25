namespace Crux.Services;

public interface IS3StorageService
{
    Task<string> UploadFileAsync(byte[] fileData, string folderPath, string fileName);
    Task DeleteFileAsync(string fileUrl);
    Task DeleteFolderAsync(string filePathOrUrl);
}