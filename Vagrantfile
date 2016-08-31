# -*- mode: ruby -*-
# vi: set ft=ruby :

GO_VERSION = "1.6.3"

unless Vagrant.has_plugin?("vagrant-vbguest")
  raise 'The following plugin is required: vagrant-vbguest.'\
        ' You can install it with \'vagrant plugin install vagrant-vbguest\''
end

Vagrant.configure(2) do |config|
  config.vm.box = "centos/7"
  config.vm.box_check_update = false

  config.vm.network "forwarded_port", guest: 3000, host: 3000, host_ip: "127.0.0.1"
  config.vm.network "forwarded_port", guest: 3333, host: 3333, host_ip: "127.0.0.1"

  config.vm.provision "shell", inline: <<-SHELL
    set -xe

    yum install -y epel-release
    yum install -y golang-#{GO_VERSION}
    yum install -y git-core

    curl -s https://rpm.nodesource.com/setup_4.x | sh -
    yum install -y nodejs
    npm install -g npm@">=3.10"
  SHELL

  config.vm.synced_folder ".", "/vagrant", type: "nfs"
  config.vm.define "nomad-ui"
end
