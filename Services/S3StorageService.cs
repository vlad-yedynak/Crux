using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;


namespace Crux.Services;

public class S3StorageService(IAmazonS3 s3Client) : IS3StorageService
{
    private readonly string _bucketName = Environment.GetEnvironmentVariable("AWS_BUCKET_NAME") ?? 
                                        throw new InvalidOperationException("AWS_BUCKET_NAME is not configured");
    
    public async Task<string> UploadFileAsync(byte[] fileData, string folderPath, string fileName)
    {
        var key = $"{folderPath}/{fileName}";

        using var memoryStream = new MemoryStream(fileData);
        var uploadRequest = new TransferUtilityUploadRequest
        {
            InputStream = memoryStream,
            BucketName = _bucketName,
            Key = key,
        };

        var transferUtility = new TransferUtility(s3Client);
        await transferUtility.UploadAsync(uploadRequest);
        
        Console.WriteLine($"Upload finished :https://{_bucketName}.s3.amazonaws.com/{key}");

        return $"https://{_bucketName}.s3.amazonaws.com/{key}";
    }
    
    public async Task DeleteFileAsync(string fileUrl)
    {
        var key = GetS3KeyFromUrl(fileUrl);
        if (string.IsNullOrEmpty(key)) return;

        var deleteRequest = new DeleteObjectRequest
        {
            BucketName = _bucketName,
            Key = key
        };

        await s3Client.DeleteObjectAsync(deleteRequest);
    }
    
    public async Task DeleteFolderAsync(string folderPath)
    {
        var listRequest = new ListObjectsV2Request
        {
            BucketName = _bucketName,
            Prefix = folderPath
        };

        var listResponse = await s3Client.ListObjectsV2Async(listRequest);
        if (listResponse.S3Objects.Count == 0) return;

        var deleteRequest = new DeleteObjectsRequest
        {
            BucketName = _bucketName,
            Objects = listResponse.S3Objects.Select(obj => new KeyVersion { Key = obj.Key }).ToList()
        };

        await s3Client.DeleteObjectsAsync(deleteRequest);
    }
    
    private string GetS3KeyFromUrl(string url)
    {
        if (string.IsNullOrEmpty(url)) return null;
        var uri = new Uri(url);
        var hostParts = uri.Host.Split('.');

        if (hostParts[0] == _bucketName)
        {
            return uri.AbsolutePath.TrimStart('/');
        }

        return null;
    }
}