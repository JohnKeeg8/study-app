# Cloud concepts

Cloud computing means renting computing resources (servers, storage, networks, software) from a provider over a network and paying for what you use, instead of buying and running everything yourself.

## Service models

The service model decides **who manages what**. Think of a stack from the physical data center up to your data: the provider takes over more of it as you move from IaaS to SaaS.

| Layer of the stack | On-premises | **IaaS** | **PaaS** | **SaaS** |
|---|---|---|---|---|
| Data and users | You | You | You | You |
| Application | You | You | You | Provider |
| Runtime and middleware | You | You | Provider | Provider |
| Operating system | You | **You** | Provider | Provider |
| Virtualization, servers, storage, networking | You | Provider | Provider | Provider |
| Facility (power, cooling, physical security) | You | Provider | Provider | Provider |

- **IaaS (Infrastructure as a Service):** you rent **virtual machines, storage, and networks**. **You install and patch the OS** and everything above it. Most control, most work. Example: cloud VMs.
- **PaaS (Platform as a Service):** you deploy **your code**; the provider runs the OS, runtime, and scaling. Example: app hosting platforms.
- **SaaS (Software as a Service):** you just **use a finished application**, usually in a browser. Example: hosted email and office suites.
- **Desktop as a Service (DaaS):** virtual desktops hosted by the provider.

## Deployment models

| Model | Who uses it | Notes |
|---|---|---|
| **Public** | Anyone; many customers share it | Pay-as-you-go, **multitenant**, run by a provider |
| **Private** | One organization | On-premises or hosted; more control, higher cost |
| **Hybrid** | Private + public **working together** | E.g. sensitive data on-premises, web front end in public cloud; **cloud bursting** sends overflow demand to public cloud |
| **Community** | Several organizations with shared needs | E.g. hospitals sharing infrastructure built for the same regulations |

**Multicloud** means using **two or more public providers**. That's different from hybrid, which is specifically private + public.

## Cloud characteristics

- **Elasticity:** resources **scale up and down automatically** with demand.
- **Scalability:** the general ability to grow.
- **Multitenancy:** many customers share the same hardware while staying **logically isolated**.
- **Metered (pay-as-you-go) service:** turns large up-front purchases (CapEx) into ongoing costs (OpEx).
- **Regions and availability zones:** zones are separate data centers within a region. Spreading workloads across zones gives **high availability**.

## Shared responsibility model

Security duties are split:
- **The provider always secures** the physical facilities, hardware, and virtualization layer.
- **The customer always owns** their **data, user accounts and permissions (IAM), and access rules** such as security groups.
- In **IaaS** the customer also patches the guest OS. In **SaaS** the provider handles almost everything except data and users.

Misconfigured customer settings, such as an open security group or a public storage bucket, are a leading cause of cloud breaches.

## Cloud networking

- **VPC (virtual private cloud):** your **logically isolated private network** in the cloud, with your own IP ranges, subnets, and route tables.
- **Public vs private subnet:** a subnet is **public** when its route table sends **0.0.0.0/0 to an internet gateway**. Private subnets have no such route.
- **Internet gateway:** gives public subnets **two-way** internet access.
- **NAT gateway:** lets private-subnet instances make **outbound** connections (e.g. downloading patches) while **blocking unsolicited inbound** connections.
- **Network security group / security group:** a **stateful** virtual firewall attached to instances or network interfaces. Return traffic is allowed automatically.
- **Network ACL:** a **stateless** filter applied to a whole subnet. Return traffic must be explicitly allowed.
- **Cloud gateways to on-premises:**
  - A **site-to-site VPN** to a cloud **VPN gateway** gives an encrypted tunnel over the internet.
  - A **direct connection** (e.g. AWS Direct Connect, Azure ExpressRoute) is a **private dedicated link**, not over the internet, with consistent performance.
- **VPC peering:** connects two VPCs privately. Peering is **not transitive** (A↔B and B↔C doesn't give A↔C).
- **Transit gateway:** a central **hub** that connects many VPCs and on-premises networks.
- **Cloud load balancer:** spreads traffic across instances in multiple zones.

## NFV

**Network functions virtualization (NFV)** runs network functions such as routers, firewalls, and load balancers as **software (VNFs, virtual network functions)** on standard servers instead of dedicated hardware appliances. In the cloud, the virtual firewall image you deploy into your VPC is a VNF.

## Common mix-ups

- **IaaS vs PaaS:** if **you patch the OS**, it's IaaS. If you just push code, it's PaaS.
- **PaaS vs SaaS:** PaaS is for **building** apps; SaaS is a **finished** app you use.
- **Hybrid vs multicloud:** hybrid = private **plus** public; multicloud = **several public** providers.
- **Internet gateway vs NAT gateway:** internet gateway = two-way access for public subnets; NAT gateway = **outbound only** for private subnets.
- **Security group vs network ACL:** security groups are **stateful** and attach to instances; NACLs are **stateless** and apply to subnets.
- **VPN gateway vs direct connection:** a VPN goes **encrypted over the internet**; a direct connection is a **private dedicated circuit**.
- **Elasticity vs scalability:** elasticity is **automatic** scaling up *and down* with demand.

## Key terms

- **VPC:** an isolated virtual network in the cloud.
- **Multitenancy:** many customers sharing infrastructure, isolated from each other.
- **Cloud bursting:** sending overflow from private to public cloud during peaks.
- **VNF:** a network function running as software.
- **Availability zone:** an isolated data center within a cloud region.

> **Exam tip:** "Customer patches the guest OS" → IaaS. "Private subnet needs outbound internet only" → NAT gateway. "Stateful rules on an instance" → security group. "Private link, not over the internet" → direct connection.
