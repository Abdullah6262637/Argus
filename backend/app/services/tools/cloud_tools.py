"""Cloud Tools - FAZ 2
AWS, Azure, GCP ve diğer bulut servisleri entegrasyonu.
S3, EC2, Lambda, Blob Storage, VM, Cloud Functions vb.
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from app.services.tools.base import BaseTool, PermissionKey, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class AWSS3ListTool(BaseTool):
    """AWS S3 bucket'larını listele."""
    
    name = "aws_s3_list"
    description = "AWS S3 bucket'larını veya bucket içindeki objeleri listeler."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "bucket_name": {
                "type": "string",
                "description": "Bucket adı (boş bırakılırsa tüm bucket'lar listelenir)"
            },
            "prefix": {
                "type": "string",
                "description": "Obje prefix'i (klasör yolu)"
            },
            "max_keys": {
                "type": "integer",
                "description": "Maksimum sonuç sayısı (varsayılan: 100)",
                "minimum": 1,
                "maximum": 1000
            }
        },
        "required": []
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            bucket_name = args.get("bucket_name")
            prefix = args.get("prefix", "")
            max_keys = args.get("max_keys", 100)
            
            try:
                import boto3
                from botocore.exceptions import ClientError, NoCredentialsError
                
                s3 = boto3.client('s3')
                
                if not bucket_name:
                    # Tüm bucket'ları listele
                    response = s3.list_buckets()
                    buckets = response.get('Buckets', [])
                    
                    if buckets:
                        bucket_list = "\n".join([f"  - {b['Name']} (oluşturulma: {b['CreationDate']})" for b in buckets])
                        output = f"AWS S3 Bucket'lar ({len(buckets)} adet):\n\n{bucket_list}"
                    else:
                        output = "Hiç bucket bulunamadı."
                    
                    return ToolResult(ok=True, output=output, data={"buckets": buckets, "count": len(buckets)})
                else:
                    # Bucket içindeki objeleri listele
                    params = {'Bucket': bucket_name, 'MaxKeys': max_keys}
                    if prefix:
                        params['Prefix'] = prefix
                    
                    response = s3.list_objects_v2(**params)
                    objects = response.get('Contents', [])
                    
                    if objects:
                        object_list = "\n".join([
                            f"  - {obj['Key']} ({obj['Size']} bytes, {obj['LastModified']})" 
                            for obj in objects[:20]  # İlk 20'yi göster
                        ])
                        if len(objects) > 20:
                            object_list += f"\n  ... ve {len(objects) - 20} obje daha"
                        
                        output = f"S3 Bucket: {bucket_name}\nPrefix: {prefix or '/'}\n\nObjeler ({len(objects)} adet):\n\n{object_list}"
                    else:
                        output = f"Bucket '{bucket_name}' boş veya prefix '{prefix}' ile eşleşen obje yok."
                    
                    return ToolResult(ok=True, output=output, data={"bucket": bucket_name, "objects": objects, "count": len(objects)})
                
            except NoCredentialsError:
                return ToolResult(ok=False, error="AWS credentials bulunamadı. AWS CLI yapılandırması gerekli: aws configure")
            except ClientError as e:
                return ToolResult(ok=False, error=f"AWS API hatası: {e.response['Error']['Message']}")
            except ImportError:
                return ToolResult(ok=False, error="boto3 paketi yüklü değil: pip install boto3")
            except Exception as e:
                return ToolResult(ok=False, error=f"S3 listele hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("AWS S3 list hatası")
            return ToolResult(ok=False, error=str(e))


class AWSS3UploadTool(BaseTool):
    """AWS S3'e dosya yükle."""
    
    name = "aws_s3_upload"
    description = "Yerel dosyayı AWS S3 bucket'a yükler."
    permission: PermissionKey = "file_system"
    
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "description": "Yüklenecek dosyanın yerel yolu"
            },
            "bucket_name": {
                "type": "string",
                "description": "Hedef S3 bucket adı"
            },
            "object_key": {
                "type": "string",
                "description": "S3'teki obje anahtarı (dosya adı/yolu)"
            }
        },
        "required": ["file_path", "bucket_name", "object_key"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            file_path = args.get("file_path")
            bucket_name = args.get("bucket_name")
            object_key = args.get("object_key")
            
            if not all([file_path, bucket_name, object_key]):
                return ToolResult(ok=False, error="file_path, bucket_name ve object_key gerekli")
            
            try:
                import boto3
                import os
                from botocore.exceptions import ClientError, NoCredentialsError
                
                if not os.path.exists(file_path):
                    return ToolResult(ok=False, error=f"Dosya bulunamadı: {file_path}")
                
                s3 = boto3.client('s3')
                
                # Dosya boyutunu al
                file_size = os.path.getsize(file_path)
                
                # Yükle
                s3.upload_file(file_path, bucket_name, object_key)
                
                # URL oluştur
                url = f"s3://{bucket_name}/{object_key}"
                
                output = f"""Dosya başarıyla yüklendi!

Yerel dosya: {file_path}
Bucket: {bucket_name}
Object key: {object_key}
Boyut: {file_size} bytes
URL: {url}
"""
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={
                        "bucket": bucket_name,
                        "key": object_key,
                        "size": file_size,
                        "url": url
                    }
                )
                
            except NoCredentialsError:
                return ToolResult(ok=False, error="AWS credentials bulunamadı")
            except ClientError as e:
                return ToolResult(ok=False, error=f"AWS API hatası: {e.response['Error']['Message']}")
            except ImportError:
                return ToolResult(ok=False, error="boto3 paketi yüklü değil: pip install boto3")
            except Exception as e:
                return ToolResult(ok=False, error=f"S3 upload hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("AWS S3 upload hatası")
            return ToolResult(ok=False, error=str(e))


class AWSEC2ListTool(BaseTool):
    """AWS EC2 instance'larını listele."""
    
    name = "aws_ec2_list"
    description = "AWS EC2 instance'larını listeler ve durumlarını gösterir."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "region": {
                "type": "string",
                "description": "AWS region (varsayılan: us-east-1)",
                "enum": ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1"]
            },
            "state": {
                "type": "string",
                "description": "Instance durumu filtresi",
                "enum": ["running", "stopped", "terminated", "all"]
            }
        },
        "required": []
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            region = args.get("region", "us-east-1")
            state_filter = args.get("state", "all")
            
            try:
                import boto3
                from botocore.exceptions import ClientError, NoCredentialsError
                
                ec2 = boto3.client('ec2', region_name=region)
                
                # Filtre oluştur
                filters = []
                if state_filter != "all":
                    filters.append({'Name': 'instance-state-name', 'Values': [state_filter]})
                
                # Instance'ları listele
                if filters:
                    response = ec2.describe_instances(Filters=filters)
                else:
                    response = ec2.describe_instances()
                
                instances = []
                for reservation in response['Reservations']:
                    for instance in reservation['Instances']:
                        instances.append({
                            'id': instance['InstanceId'],
                            'type': instance['InstanceType'],
                            'state': instance['State']['Name'],
                            'launch_time': str(instance['LaunchTime']),
                            'private_ip': instance.get('PrivateIpAddress', 'N/A'),
                            'public_ip': instance.get('PublicIpAddress', 'N/A')
                        })
                
                if instances:
                    instance_list = "\n".join([
                        f"  - {inst['id']} ({inst['type']}) - {inst['state']}\n"
                        f"    Private IP: {inst['private_ip']}, Public IP: {inst['public_ip']}"
                        for inst in instances
                    ])
                    output = f"EC2 Instances ({region}) - {len(instances)} adet:\n\n{instance_list}"
                else:
                    output = f"Region '{region}' içinde instance bulunamadı."
                
                return ToolResult(ok=True, output=output, data={"region": region, "instances": instances, "count": len(instances)})
                
            except NoCredentialsError:
                return ToolResult(ok=False, error="AWS credentials bulunamadı")
            except ClientError as e:
                return ToolResult(ok=False, error=f"AWS API hatası: {e.response['Error']['Message']}")
            except ImportError:
                return ToolResult(ok=False, error="boto3 paketi yüklü değil: pip install boto3")
            except Exception as e:
                return ToolResult(ok=False, error=f"EC2 list hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("AWS EC2 list hatası")
            return ToolResult(ok=False, error=str(e))


class AzureBlobListTool(BaseTool):
    """Azure Blob Storage container'larını listele."""
    
    name = "azure_blob_list"
    description = "Azure Blob Storage container'larını veya blob'ları listeler."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "connection_string": {
                "type": "string",
                "description": "Azure Storage connection string (env: AZURE_STORAGE_CONNECTION_STRING)"
            },
            "container_name": {
                "type": "string",
                "description": "Container adı (boş bırakılırsa tüm container'lar listelenir)"
            }
        },
        "required": []
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import os
            connection_string = args.get("connection_string") or os.getenv("AZURE_STORAGE_CONNECTION_STRING")
            container_name = args.get("container_name")
            
            if not connection_string:
                return ToolResult(ok=False, error="Azure Storage connection string gerekli")
            
            try:
                from azure.storage.blob import BlobServiceClient
                
                blob_service_client = BlobServiceClient.from_connection_string(connection_string)
                
                if not container_name:
                    # Tüm container'ları listele
                    containers = list(blob_service_client.list_containers())
                    
                    if containers:
                        container_list = "\n".join([f"  - {c.name}" for c in containers])
                        output = f"Azure Blob Containers ({len(containers)} adet):\n\n{container_list}"
                    else:
                        output = "Hiç container bulunamadı."
                    
                    return ToolResult(ok=True, output=output, data={"containers": [c.name for c in containers], "count": len(containers)})
                else:
                    # Container içindeki blob'ları listele
                    container_client = blob_service_client.get_container_client(container_name)
                    blobs = list(container_client.list_blobs())
                    
                    if blobs:
                        blob_list = "\n".join([
                            f"  - {blob.name} ({blob.size} bytes)"
                            for blob in blobs[:20]
                        ])
                        if len(blobs) > 20:
                            blob_list += f"\n  ... ve {len(blobs) - 20} blob daha"
                        
                        output = f"Container: {container_name}\n\nBlobs ({len(blobs)} adet):\n\n{blob_list}"
                    else:
                        output = f"Container '{container_name}' boş."
                    
                    return ToolResult(ok=True, output=output, data={"container": container_name, "blobs": [b.name for b in blobs], "count": len(blobs)})
                
            except ImportError:
                return ToolResult(ok=False, error="azure-storage-blob paketi yüklü değil: pip install azure-storage-blob")
            except Exception as e:
                return ToolResult(ok=False, error=f"Azure Blob hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Azure Blob list hatası")
            return ToolResult(ok=False, error=str(e))


class GCPStorageListTool(BaseTool):
    """Google Cloud Storage bucket'larını listele."""
    
    name = "gcp_storage_list"
    description = "GCP Cloud Storage bucket'larını veya objeleri listeler."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "project_id": {
                "type": "string",
                "description": "GCP Project ID"
            },
            "bucket_name": {
                "type": "string",
                "description": "Bucket adı (boş bırakılırsa tüm bucket'lar listelenir)"
            }
        },
        "required": []
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            project_id = args.get("project_id")
            bucket_name = args.get("bucket_name")
            
            try:
                from google.cloud import storage
                
                if not bucket_name:
                    # Tüm bucket'ları listele
                    if not project_id:
                        return ToolResult(ok=False, error="project_id gerekli")
                    
                    client = storage.Client(project=project_id)
                    buckets = list(client.list_buckets())
                    
                    if buckets:
                        bucket_list = "\n".join([f"  - {b.name}" for b in buckets])
                        output = f"GCS Buckets ({len(buckets)} adet):\n\n{bucket_list}"
                    else:
                        output = "Hiç bucket bulunamadı."
                    
                    return ToolResult(ok=True, output=output, data={"buckets": [b.name for b in buckets], "count": len(buckets)})
                else:
                    # Bucket içindeki objeleri listele
                    client = storage.Client()
                    bucket = client.bucket(bucket_name)
                    blobs = list(bucket.list_blobs())
                    
                    if blobs:
                        blob_list = "\n".join([
                            f"  - {blob.name} ({blob.size} bytes)"
                            for blob in blobs[:20]
                        ])
                        if len(blobs) > 20:
                            blob_list += f"\n  ... ve {len(blobs) - 20} obje daha"
                        
                        output = f"Bucket: {bucket_name}\n\nObjeler ({len(blobs)} adet):\n\n{blob_list}"
                    else:
                        output = f"Bucket '{bucket_name}' boş."
                    
                    return ToolResult(ok=True, output=output, data={"bucket": bucket_name, "objects": [b.name for b in blobs], "count": len(blobs)})
                
            except ImportError:
                return ToolResult(ok=False, error="google-cloud-storage paketi yüklü değil: pip install google-cloud-storage")
            except Exception as e:
                return ToolResult(ok=False, error=f"GCP Storage hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("GCP Storage list hatası")
            return ToolResult(ok=False, error=str(e))
